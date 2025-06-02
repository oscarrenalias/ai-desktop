use log::{ info, error };
use rmcp::model::CallToolRequestParam;
use rmcp::{
  model::{CallToolResult, Tool},
  service::RunningService,
  transport::TokioChildProcess,
  RoleClient, ServiceExt,
};
use serde_json::{Map, Value};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::State;
use tokio::process::Command;
use tokio::sync::Mutex;

pub struct McpState {
  pub clients: HashMap<String, RunningService<RoleClient, ()>>,
}

// Internal logic for use in both Tauri commands and integration tests
pub async fn connect_server_internal(
  state: Arc<Mutex<McpState>>,
  connection_id: String,
  command: String,
  args: Vec<String>,
) -> Result<(), String> {
  let mut state = state.lock().await;
  if state.clients.contains_key(&connection_id) {
    error!("Client with id '{}' already connected", connection_id);
    return Err(format!("Client with id '{}' already connected", connection_id));
  }
  let child_process = TokioChildProcess::new(Command::new(command).args(args)).unwrap();
  let service: RunningService<RoleClient, ()> = ().serve(child_process).await.unwrap();
  state.clients.insert(connection_id, service);
  Ok(())
}

#[tauri::command]
pub async fn connect_server(
  state: tauri::State<'_, Arc<Mutex<McpState>>>,
  connection_id: String,
  command: String,
  args: Vec<String>,
) -> Result<(), String> {
  connect_server_internal(state.inner().clone(), connection_id, command, args).await
}

pub async fn disconnect_server_internal(state: Arc<Mutex<McpState>>, connection_id: String) -> Result<(), String> {
  let mut state = state.lock().await;
  if let Some(client) = state.clients.remove(&connection_id) {
    client.cancel().await.unwrap();
    Ok(())
  } else {
    Err(format!("Client with id '{}' not connected", connection_id))
  }
}

#[tauri::command]
pub async fn disconnect_server(state: tauri::State<'_, Arc<Mutex<McpState>>>, connection_id: String) -> Result<(), String> {
  disconnect_server_internal(state.inner().clone(), connection_id).await
}

pub async fn list_tools_internal(state: Arc<Mutex<McpState>>, connection_id: String) -> Result<Vec<Tool>, String> {
  let state = state.lock().await;
  let client = state.clients.get(&connection_id);
  if client.is_none() {
    return Err(format!("Client with id '{}' not connected", connection_id));
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
pub async fn list_tools(state: tauri::State<'_, Arc<Mutex<McpState>>>, connection_id: String) -> Result<Vec<Tool>, String> {
  list_tools_internal(state.inner().clone(), connection_id).await
}

pub async fn call_tool_internal(
  state: Arc<Mutex<McpState>>,
  connection_id: String,
  name: String,
  args: Option<Map<String, Value>>,
) -> Result<CallToolResult, String> {
  info!("Calling tool: {:?} on connection_id: {}", name, connection_id);
  info!("Arguments: {:?}", args);
  let state = state.lock().await;
  let client = state.clients.get(&connection_id);
  if client.is_none() {
    error!("Client with id '{}' not connected", connection_id);
    return Err(format!("Client with id '{}' not connected", connection_id));
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

#[tauri::command]
pub async fn call_tool(
  state: tauri::State<'_, Arc<Mutex<McpState>>>,
  connection_id: String,
  name: String,
  args: Option<Map<String, Value>>,
) -> Result<CallToolResult, String> {
  call_tool_internal(state.inner().clone(), connection_id, name, args).await
}