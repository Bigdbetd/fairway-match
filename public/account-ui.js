const forms = document.querySelector('#forms');
const accountPanel = document.querySelector('#account');
const status = document.querySelector('#status');
const signInForm = document.querySelector('#sign-in');

function showAccount(account) {
  forms.hidden = Boolean(account);
  accountPanel.hidden = !account;
  document.querySelector('#account-name').textContent = account ? `Welcome, ${account.displayName}` : '';
}

async function request(path, data) {
  const response = await fetch(path, data === undefined ? {} : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (response.status === 204) return {};
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? 'Request failed');
  return result;
}

function handleForm(selector, submit) {
  const form = document.querySelector(selector);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button');
    button.disabled = true;
    status.textContent = '';
    try {
      await submit(Object.fromEntries(new FormData(form)));
      form.reset();
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
}

handleForm('#register', async (fields) => {
  await request('/api/accounts', fields);
  signInForm.elements.email.value = fields.email.trim().toLowerCase();
  status.textContent = 'Account created. Sign in with your new password.';
  signInForm.elements.password.focus();
});

handleForm('#sign-in', async (fields) => {
  const { account } = await request('/api/sessions', fields);
  showAccount(account);
});

handleForm('#create-match', async (fields) => {
  await request('/api/matches', {
    ...fields,
    teeTime: new Date(fields.teeTime).toISOString(),
    capacity: Number(fields.capacity)
  });
  status.textContent = 'Match created.';
});

document.querySelector('#sign-out').addEventListener('click', async () => {
  try {
    await request('/api/logout', {});
    showAccount();
    status.textContent = 'Signed out.';
  } catch (error) {
    status.textContent = error.message;
  }
});

const session = await fetch('/api/session').catch(() => null);
if (session?.ok) {
  const { account } = await session.json();
  showAccount(account);
} else {
  showAccount();
  if (session?.status !== 401) status.textContent = 'Account service is temporarily unavailable.';
}
