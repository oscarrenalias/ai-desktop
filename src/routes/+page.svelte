<script lang="ts">
  import { runAgent, runAgentStream } from '$lib/agent/agent';
  import { marked } from 'marked';
  import { ToolbarButton, Toolbar, Button, Modal, modal } from 'flowbite-svelte';
  import { CogOutline } from 'flowbite-svelte-icons';
  import { AppConfig } from '$lib/config';
  import type { Action } from 'svelte/action';
  import { Logger } from '$lib/logger';
  import { testMcp, mcpDiscoverTools } from '$lib/mcp/test-mcp';

  let logger = Logger.getLogger('App');

  let input = $state('');
  let messages = $state<{ role: 'user' | 'assistant'; content: string }[]>([]);
  let loading = $state(false);
  let streamingContent = $state('');

  // controls visiblity of the config modal
  let showConfigModal = $state(false);
  let modalContent: string | null = $state(null);

  $effect(() => {
    if (showConfigModal) {
      loadModalcontent();
    }
  });

  async function sendMessage() {
    if (input.trim() === '') return;
    // Add user message immediately
    messages = [...messages, { role: 'user', content: input }];
    const userInput = input;
    input = '';
    loading = true;
    streamingContent = '';
    // Stream agent response
    runAgentStream(userInput, (partial) => {
      streamingContent = partial;
    }).then(final => {
      messages = [...messages, { role: 'assistant', content: final }];
      streamingContent = '';
      loading = false;
    });
  }

  // Svelte action for markdown rendering
  export const markdown: Action<HTMLElement, string> = (node, content) => {
    node.innerHTML = marked.parse(content);
    return {
      update(newContent: string) {
        node.innerHTML = marked.parse(newContent);
      }
    };
  }

  async function loadModalcontent() {
    modalContent = null;
    let config = await AppConfig.getInstance().getAll();
    modalContent = JSON.stringify(config, null, 2);
    logger.debug(modalContent);
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 dark:from-gray-900 dark:to-blue-950 flex items-center justify-center">  
  <div class="w-full h-screen max-w-7xl bg-white dark:bg-gray-900 rounded-b-2xl shadow-2xl flex flex-col">
    <header class="px-0 py-0 border-b dark:border-gray-800 flex items-center justify-between">
      <div class="flex-1 pl-6 flex items-center gap-4">
        <div class="flex flex-row gap-2">
          <button onclick={testMcp} class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full shadow-md transition">
            Test MCP
          </button>
          <button onclick={mcpDiscoverTools} class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full shadow-md transition">
            MCP Discover Tools
          </button>
        </div>
        <h1 class="text-2xl font-bold text-blue-600 dark:text-blue-300 tracking-tight ml-4">AI Desktop Chat</h1>
      </div>
      <div class="flex items-center pr-6">
        <Toolbar class="w-full rounded-none border-none shadow-none bg-transparent">
          <ToolbarButton onclick={() => (showConfigModal = true)}>
            <CogOutline class="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </ToolbarButton>
        </Toolbar>
      </div>    
    </header>
    <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-white dark:bg-gray-900">
      {#if messages.length === 0}
        <div class="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
          <img src="/robot.svg" alt="Robot" class="w-20 h-20 mb-2" />
          <span>Start the conversation!</span>
        </div>
      {/if}
      {#each messages as message}
        {#if message.role === 'user'}
          <div class="flex justify-end">
            <div class="max-w-[75%] px-4 py-2 rounded-lg shadow text-base whitespace-pre-line bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700">
              {message.content}
            </div>
          </div>
        {:else}
          <div class="flex justify-start">
            <div class="max-w-[75%] px-0 py-0 text-base text-gray-900 dark:text-gray-100">
              <div class="prose prose-sm prose-blue dark:prose-invert break-words" use:markdown={message.content}></div>
            </div>
          </div>
        {/if}
      {/each}
      {#if loading && streamingContent}
        <div class="flex justify-start">
          <div class="max-w-[75%] px-0 py-0 text-base text-gray-900 dark:text-gray-100">
            <div class="prose prose-sm prose-blue dark:prose-invert break-words" use:markdown={streamingContent}></div>
          </div>
        </div>
      {:else if loading}
        <div class="flex justify-start">
          <div class="max-w-[75%] px-4 py-2 rounded-2xl shadow-md text-base bg-yellow-50 dark:bg-yellow-900 text-gray-400 dark:text-gray-300 border-l-4 border-yellow-200 dark:border-yellow-700 italic flex items-center gap-2">
            <svg class="animate-spin h-5 w-5 text-yellow-400 dark:text-yellow-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span>Thinking…</span>
          </div>
        </div>
      {/if}
    </div>
    <form
      class="px-6 py-4 border-t flex gap-2 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
      onsubmit={event => { event.preventDefault(); sendMessage(); }}
    >
      <input
        class="flex-1 border border-gray-300 dark:border-gray-700 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-700 transition text-base bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        bind:value={input}
        placeholder="Type your message..."
        autocomplete="off"
      />
      <button class="bg-blue-500 hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-6 py-2 rounded-full font-semibold transition" type="submit" disabled={loading}>
        Send
      </button>
    </form>
  </div>
</div>

<Modal title="Configuration data" size="l" bind:open={showConfigModal} autoclose on:close={() => (showConfigModal = false)}>
  <pre class="text-base leading-relaxed text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 p-4 rounded">
    {modalContent}
  </pre>
</Modal>