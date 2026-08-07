document.addEventListener('DOMContentLoaded', () => {
    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const chatIcon = document.getElementById('chat-icon');
    const closeIcon = document.getElementById('close-icon');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    let isOpen = false;

    chatToggle.addEventListener('click', () => {
        isOpen = !isOpen;
        if (isOpen) {
            chatWindow.classList.remove('hidden');
            setTimeout(() => {
                chatWindow.classList.remove('translate-y-4', 'opacity-0');
            }, 10);
            chatIcon.classList.add('hidden');
            closeIcon.classList.remove('hidden');
        } else {
            chatWindow.classList.add('translate-y-4', 'opacity-0');
            setTimeout(() => {
                chatWindow.classList.add('hidden');
            }, 300);
            chatIcon.classList.remove('hidden');
            closeIcon.classList.add('hidden');
        }
    });

    const addMessage = (message, isBot = false) => {
        const div = document.createElement('div');
        div.className = isBot ? 'flex gap-2' : 'flex gap-2 justify-end';
        
        const contentClass = isBot 
            ? 'max-w-[80%] bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-slate-800 border border-slate-100'
            : 'max-w-[80%] bg-[#0f172a] p-3 rounded-2xl rounded-tr-none shadow-md text-sm text-white';

        div.innerHTML = `
            <div class="${contentClass}">
                ${message}
            </div>
        `;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;

        addMessage(message, false);
        chatInput.value = '';

        // Add loading indicator
        const loadingId = 'loading-' + Date.now();
        const loadingDiv = document.createElement('div');
        loadingDiv.id = loadingId;
        loadingDiv.className = 'flex gap-2';
        loadingDiv.innerHTML = `
            <div class="max-w-[80%] bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-slate-400 border border-slate-100 italic">
                Thinking...
            </div>
        `;
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            const data = await response.json();
            
            // Remove loading
            document.getElementById(loadingId).remove();

            if (data.reply) {
                addMessage(data.reply, true);
            } else {
                addMessage("I'm sorry, I'm having trouble connecting right now. Please try again or call us at +1 780-456-8060.", true);
            }
        } catch (error) {
            document.getElementById(loadingId).remove();
            addMessage(`Oops! I'm having tech issues. <br><br>👉 <a href="/debug-ai" class="text-blue-600 underline font-bold">Check AI Status</a>`, true);
        }
    });
});
