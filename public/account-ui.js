const forms = document.querySelector('#forms');
const accountPanel = document.querySelector('#account');
const status = document.querySelector('#status');
const matchList = document.querySelector('#match-list');
const formatNames = { casual: 'Casual round', stroke: 'Stroke play', match: 'Match play' };
const signInForm = document.querySelector('#sign-in');

function showAccount(account) {
  forms.hidden = Boolean(account);
  accountPanel.hidden = !account;
  if (!account) matchList.replaceChildren();
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

async function refreshMatches() {
  try {
    const { matches } = await request('/api/matches');
    matchList.replaceChildren();
    if (matches.length === 0) {
      const empty = document.createElement('li');
      empty.textContent = 'No upcoming matches available.';
      matchList.append(empty);
    }
    for (const match of matches) {
      const item = document.createElement('li');
      const details = document.createElement('p');
      const teeTime = new Date(match.teeTime).toLocaleString();
      details.textContent = `${match.course} · ${teeTime} · ${formatNames[match.format]} · ${match.playerCount}/${match.capacity} players`;
      item.append(details);
      if (match.joined) {
        item.append('Joined');
      } else {
        const join = document.createElement('button');
        join.type = 'button';
        join.textContent = 'Join match';
        join.addEventListener('click', async () => {
          join.disabled = true;
          try {
            await request(`/api/matches/${match.id}/join`, {});
            status.textContent = 'Match joined.';
          } catch (error) {
            status.textContent = error.message;
          }
          await refreshMatches();
          join.disabled = false;
        });
        item.append(join);
      }
      matchList.append(item);
    }
  } catch (error) {
    status.textContent = error.message;
  }
}

document.querySelector('#refresh-matches').addEventListener('click', refreshMatches);

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
  await refreshMatches();
});

handleForm('#create-match', async (fields) => {
  await request('/api/matches', {
    ...fields,
    teeTime: new Date(fields.teeTime).toISOString(),
    capacity: Number(fields.capacity)
  });
  status.textContent = 'Match created.';
  await refreshMatches();
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
  await refreshMatches();
} else {
  showAccount();
  if (session?.status !== 401) status.textContent = 'Account service is temporarily unavailable.';
}
