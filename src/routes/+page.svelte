<script lang="ts">
  import { runAgent, runAgentStream } from '$lib/agent/agent';
  import { marked } from 'marked';
  import { ToolbarButton, Toolbar } from 'flowbite-svelte';
  import { CogOutline } from 'flowbite-svelte-icons';

  let input = '';
  let messages: { role: 'user' | 'assistant'; content: string }[] = [];
  let loading = false;
  let streamingContent = '';

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
  export function markdown(node: HTMLElement, content: string) {
    node.innerHTML = marked.parse(content);
    return {
      update(newContent: string) {
        node.innerHTML = marked.parse(newContent);
      }
    };
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 flex items-center justify-center">
  <div class="w-full h-screen max-w-7xl bg-white rounded-b-2xl shadow-2xl flex flex-col">
    <header class="px-0 py-0 border-b flex items-center justify-between">
      <Toolbar class="w-full rounded-none border-none shadow-none bg-transparent">
        <div class="flex-1 pl-6">
          <h1 class="text-2xl font-bold text-blue-600 tracking-tight">AI Desktop Chat</h1>
        </div>
        <div class="flex items-center pr-6">
          <ToolbarButton>
            <CogOutline class="w-6 h-6 text-gray-500" />
          </ToolbarButton>
        </div>
      </Toolbar>
    </header>
    <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-white">
      {#if messages.length === 0}
        <div class="flex flex-col items-center justify-center h-full text-gray-400">
          <img src="/robot.svg" alt="Robot" class="w-20 h-20 mb-2" />
          <span>Start the conversation!</span>
        </div>
      {/if}
      {#each messages as message}
        {#if message.role === 'user'}
          <div class="flex justify-end">
            <div class="max-w-[75%] px-4 py-2 rounded-lg shadow text-base whitespace-pre-line bg-gray-200 text-gray-900 border border-gray-300">
              {message.content}
            </div>
          </div>
        {:else}
          <div class="flex justify-start">
            <div class="max-w-[75%] px-0 py-0 text-base text-gray-900">
              <div class="prose prose-sm prose-blue break-words" use:markdown={message.content}></div>
            </div>
          </div>
        {/if}
      {/each}
      {#if loading && streamingContent}
        <div class="flex justify-start">
          <div class="max-w-[75%] px-0 py-0 text-base text-gray-900">
            <div class="prose prose-sm prose-blue break-words" use:markdown={streamingContent}></div>
          </div>
        </div>
      {:else if loading}
        <div class="flex justify-start">
          <div class="max-w-[75%] px-4 py-2 rounded-2xl shadow-md text-base bg-yellow-50 text-gray-400 border-l-4 border-yellow-200 italic flex items-center gap-2">
            <svg class="animate-spin h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span>Thinking…</span>
          </div>
        </div>
      {/if}
    </div>
    <form
      class="px-6 py-4 border-t flex gap-2 bg-white"
      on:submit|preventDefault={sendMessage}
    >
      <input
        class="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base bg-gray-50"
        bind:value={input}
        placeholder="Type your message..."
        autocomplete="off"
      />
      <button class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full font-semibold transition" type="submit" disabled={loading}>
        Send
      </button>
    </form>
  </div>
</div>