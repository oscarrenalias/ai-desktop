use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]

mod mcp;

use mcp::{
  connect_server, disconnect_server, list_tools, call_tool, McpState,
};

pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
            // data dir
            let path = app.path().data_dir();
            println!("Data dir: {:?}", path.unwrap());
            // config dir
            let path = app.path().config_dir();
            println!("Config dir: {:?}", path.unwrap());            

      Ok(())
    })
    .plugin(tauri_plugin_log::Builder::default()
      .level(log::LevelFilter::Debug) // Default for all crates
      .target(tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout))
      .build())
    .plugin(tauri_plugin_fs::init())
    .invoke_handler(tauri::generate_handler![list_tools, connect_server, disconnect_server, call_tool])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}