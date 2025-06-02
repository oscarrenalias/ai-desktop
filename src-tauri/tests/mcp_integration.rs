//! Integration test for MCP backend using real Docker MCP server
//! Requires Docker and network access to ghcr.io/oscarrenalias/mcp-server-bmi:latest

use app_lib::mcp::{McpState, connect_server_internal, list_tools_internal, call_tool_internal, disconnect_server_internal};
use rmcp::model::RawContent;
use std::sync::Arc;
use tokio::sync::Mutex;
use serde_json::json;

#[tokio::test]
async fn test_successful_end_to_end_docker() {
    // Prepare shared state
    let state = Arc::new(Mutex::new(McpState { client: None }));

    // Start the MCP server via Docker
    let connect_result = connect_server_internal(
        state.clone(),
        "docker".to_string(),
        vec![
            "run".to_string(),
            "-i".to_string(),
            "--rm".to_string(),
            "ghcr.io/oscarrenalias/mcp-server-bmi:latest".to_string(),
        ],
    ).await;
    assert!(connect_result.is_ok(), "connect_server failed: {connect_result:?}");

    // List tools
    let tools_result = list_tools_internal(state.clone()).await;
    assert!(tools_result.is_ok(), "list_tools failed: {tools_result:?}");
    let tools = tools_result.unwrap();
    assert!(!tools.is_empty(), "No tools found");
    let bmi_tool = tools.iter().find(|t| t.name == "calculate_bmi");
    assert!(bmi_tool.is_some(), "BMI tool not found");

    // Call the BMI tool
    let args = serde_json::Map::from_iter([
        ("height".to_string(), json!(1.75)),
        ("weight".to_string(), json!(70)),
    ]);
    let call_result = call_tool_internal(
        state.clone(),
        "calculate_bmi".to_string(),
        Some(args),
    ).await;

    let result = call_result.unwrap();
    // Extract the text value from the result structure
    let first_content = result.content.get(0).expect("No content in result");
    let value = match &first_content.raw {
        RawContent::Text(text) => &text.text,
        _ => panic!("Unexpected content type"),
    };
    assert_eq!(value, "22.86", "Unexpected BMI result: {}", value);
    println!("BMI tool result: {}", value);

    // Disconnect
    let disconnect_result = disconnect_server_internal(state.clone()).await;
    assert!(disconnect_result.is_ok(), "disconnect_server failed: {disconnect_result:?}");
}

#[tokio::test]
async fn test_wrong_tool_call_docker() {
    // Prepare shared state
    let state = Arc::new(Mutex::new(McpState { client: None }));

    // Start the MCP server via Docker
    let connect_result = connect_server_internal(
        state.clone(),
        "docker".to_string(),
        vec![
            "run".to_string(),
            "-i".to_string(),
            "--rm".to_string(),
            "ghcr.io/oscarrenalias/mcp-server-bmi:latest".to_string(),
        ],
    ).await;
    assert!(connect_result.is_ok(), "connect_server failed: {connect_result:?}");

    // Call a tool that does not exist
    let args = serde_json::Map::from_iter([
        ("height".to_string(), json!(1.75)),
        ("weight".to_string(), json!(70)),
    ]);
    let call_result = call_tool_internal(
        state.clone(),
        "xxx".to_string(),
        Some(args),
    ).await;

    // check that the call succeeded...
    assert!(call_result.is_ok(), "Expected ok response, got: {call_result:?}");
    // ...but the result should be an error from the MCP server
    let result = call_result.unwrap();
    assert_eq!(result.is_error, Some(true), "Expected error, got {:?}", result.is_error);

    // Disconnect
    let disconnect_result = disconnect_server_internal(state.clone()).await;
    assert!(disconnect_result.is_ok(), "disconnect_server failed: {disconnect_result:?}");
}

// To run: cargo test --test mcp_integration
// This test requires Docker and network access to pull the MCP server image.
