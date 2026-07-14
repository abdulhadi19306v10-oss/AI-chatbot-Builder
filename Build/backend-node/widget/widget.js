(function() {
  const script = document.currentScript;
  const botToken = script.getAttribute('data-bot-token');
  if (!botToken) return console.error('Chatbot Builder: data-bot-token is missing');

  const origin = new URL(script.src).origin;
  
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.zIndex = '999999';
  container.style.width = '60px';
  container.style.height = '60px';
  container.style.border = 'none';
  container.style.transition = 'width 0.2s, height 0.2s';

  const iframe = document.createElement('iframe');
  iframe.src = `${origin}/widget/iframe.html?bot_token=${botToken}`;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.allowTransparency = 'true';
  iframe.style.background = 'transparent';
  iframe.style.colorScheme = 'normal';
  
  container.appendChild(iframe);
  document.body.appendChild(container);

  window.addEventListener('message', (e) => {
    if (e.origin !== origin) return;
    if (e.data.type === 'CHATBOT_RESIZE') {
      container.style.width = e.data.width;
      container.style.height = e.data.height;
    }
  });
})();
