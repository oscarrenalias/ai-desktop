use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
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
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}