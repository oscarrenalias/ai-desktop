<script lang="ts">
  import { runAgent } from '$lib/agent/agent';
  import { marked } from 'marked';

  let input = '';
  let messages: { role: 'user' | 'assistant'; content: string }[] = [];
  let loading = false;

  async function sendMessage() {
    if (input.trim() === '') return;
    // Add user message immediately
    messages = [...messages, { role: 'user', content: input }];
    const userInput = input;
    input = '';
    loading = true;
    // Asynchronously get agent response
    runAgent(userInput).then(response => {
      messages = [...messages, { role: 'assistant', content: response }];
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
    <header class="px-6 py-4 border-b flex items-center justify-between">
      <h1 class="text-2xl font-bold text-blue-600 tracking-tight">AI Desktop Chat</h1>
    </header>
    <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-white">
      {#if messages.length === 0}
        <div class="flex flex-col items-center justify-center h-full text-gray-400">
          <svg class="w-16 h-16 mb-2" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.728 9-8.333 0-2.02-1.01-3.85-2.67-5.13M12 20.25c-4.97 0-9-3.728-9-8.333 0-2.02 1.01-3.85 2.67-5.13m6.33 13.463V21m0 0c-2.485 0-4.5-1.567-4.5-3.5 0-.828.895-1.5 2-1.5s2 .672 2 1.5c0 1.933-2.015 3.5-4.5 3.5zm0 0c2.485 0 4.5-1.567 4.5-3.5 0-.828-.895-1.5-2-1.5s-2 .672-2 1.5c0 1.933 2.015 3.5 4.5 3.5z"/></svg>
          <span>Start the conversation!</span>
        </div>
      {/if}
      {#each messages as message}
        {#if message.role === 'user'}
          <div class="flex justify-end">
            <div class="max-w-[75%] px-4 py-2 rounded-2xl shadow-md text-base whitespace-pre-line bg-blue-500 text-white rounded-br-none">
              {message.content}
            </div>
          </div>
        {:else}
          <div class="flex justify-start">
            <div class="max-w-[75%] px-4 py-2 rounded-2xl shadow-md text-base bg-yellow-50 text-gray-900 border-l-4 border-yellow-400">
              <div class="prose prose-sm prose-blue break-words" use:markdown={message.content}></div>
            </div>
          </div>
        {/if}
      {/each}
      {#if loading}
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