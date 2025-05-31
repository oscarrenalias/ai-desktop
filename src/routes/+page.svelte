<script lang="ts">
  import { onMount } from 'svelte';
  import { runAgent } from '$lib/agent/agent';
  import { marked } from 'marked';

  let input = '';
  let messages: { role: 'user' | 'assistant'; content: string }[] = [];

  async function sendMessage() {
    if (input.trim() === '') return;
    messages = [...messages, { role: 'user', content: input }];
    const response = await runAgent(input);
    messages = [...messages, { role: 'assistant', content: response }];
    input = '';
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
        <div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
          <div class="max-w-[75%] px-4 py-2 rounded-2xl shadow-md text-base whitespace-pre-line
            {message.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}">
            <div class="prose prose-sm prose-blue break-words" innerHTML={marked.parse(message.content)}></div>
          </div>
        </div>
      {/each}
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
      <button class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full font-semibold transition" type="submit">
        Send
      </button>
    </form>
  </div>
</div>