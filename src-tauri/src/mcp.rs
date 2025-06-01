use log::{ info, error };
use rmcp::model::CallToolRequestParam;
use rmcp::{
  model::{CallToolResult, Tool},
  service::RunningService,
  transport::TokioChildProcess,
  RoleClient, ServiceExt,
};
use serde_json::{Map, Value};
use std::sync::Arc;
use tauri::State;
use tokio::process::Command;
use tokio::sync::Mutex;

pub struct McpState {
  pub client: Option<RunningService<RoleClient, ()>>,
}

#[tauri::command]
pub async fn connect_server(
  state: tauri::State<'_, Arc<Mutex<McpState>>>,
  command: String,
  args: Vec<String>,
) -> Result<(), String> {
  let mut state = state.lock().await;

  if state.client.is_some() {
    error!("Client already connected");
    return Err("Client already connected".to_string());
  }

  let child_process = TokioChildProcess::new(Command::new(command).args(args)).unwrap();

  let service: RunningService<RoleClient, ()> = ().serve(child_process).await.unwrap();

  state.client = Some(service);

  Ok(())
}

#[tauri::command]
pub async fn disconnect_server(state: tauri::State<'_, Arc<Mutex<McpState>>>) -> Result<(), String> {
  let mut state = state.lock().await;
  if state.client.is_none() {
    return Err("Client not connected".to_string());
  }

  state.client.take().unwrap().cancel().await.unwrap();
  state.client = None;

  Ok(())
}

#[tauri::command]
pub async fn list_tools(state: tauri::State<'_, Arc<Mutex<McpState>>>) -> Result<Vec<Tool>, String> {
  let state = state.lock().await;
  let client = state.client.as_ref();
  if client.is_none() {
    return Err("Client not connected".to_string());
  }

  let list_tools_result = client
    .unwrap()
    .list_tools(Default::default())
    .await
    .unwrap();
  let tools = list_tools_result.tools;

  Ok(tools)
}

#[tauri::command]
pub async fn call_tool(
  state: tauri::State<'_, Arc<Mutex<McpState>>>,
  name: String,
  args: Option<Map<String, Value>>,
) -> Result<CallToolResult, String> {
  info!("Calling tool: {:?}", name);
  info!("Arguments: {:?}", args);

  let state = state.lock().await;
  let client = state.client.as_ref();
  if client.is_none() {
    error!("Client not connected");
    return Err("Client not connected".to_string());
  }

  let call_tool_result = client
    .unwrap()
    .call_tool(CallToolRequestParam {
      name: name.into(),
      arguments: args,
    })
    .await
    .unwrap();

  info!("Tool result: {:?}", call_tool_result);

  Ok(call_tool_result) 
}