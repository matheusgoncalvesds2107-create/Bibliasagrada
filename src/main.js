import { LocalNotifications } from '@capacitor/local-notifications';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import './style.css';

const $ = s => document.querySelector(s);

let books = [];
let daily = [];
let bible = null;
let page = 'home';
let selectedBook = 0;
let selectedChapter = 1;
let timer = null;
let seconds = 1800;
let speaking = false;

const state = JSON.parse(
  localStorage.getItem('bibleState') ||
  '{"favorites":[],"read":{},"notifications":[],"dark":true}'
);

const save = () =>
  localStorage.setItem('bibleState', JSON.stringify(state));

const today = () => {
  const now = new Date();
  const k =
    now.getFullYear() +
    '-' +
    String(now.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(now.getDate()).padStart(2, '0');

  return daily.find(x => x.date === k) || daily[0];
};

const escape = s =>
  String(s ?? '').replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));

function addNotif(text) {
  state.notifications.unshift({
    id: Date.now(),
    text,
    seen: false
  });

  state.notifications =
    state.notifications.slice(0, 50);

  save();
  badge();
}

function badge() {
  const b = $('#badge');
  if (b) {
    b.textContent =
      state.notifications.filter(n => !n.seen).length || '';
  }
}

function nav(p) {
  page = p;
  render();
}

function layout(content) {
  return `
    <header>
      <div class="brand">
        <img src="/icon.png">
        <div>
          <b>BÍBLIA SAGRADA</b>
          <span>& DEVOCIONAL LITE</span>
        </div>
      </div>

      <button id="bell" class="bell">
        🔔<i id="badge"></i>
      </button>
    </header>

    <main>${content}</main>

    <nav>
      ${[
        ['home','⌂','Início'],
        ['bible','📖','Bíblia'],
        ['devotional','🙏','Devocional'],
        ['sermon','🎙️','Pregação'],
        ['favorites','❤️','Favoritos']
      ].map(x => `
        <button
          class="${page === x[0] ? 'active' : ''}"
          data-p="${x[0]}"
        >
          ${x[1]}
          <span>${x[2]}</span>
        </button>
      `).join('')}
    </nav>
  `;
}

function home() {
  const d = today();

  return `
    <section class="hero">
      <small>
        ${new Date().toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long'
        })}
      </small>

      <h1>${escape(d?.theme || 'Palavra do Dia')}</h1>

      <div class="verse">
        <b>${escape(d?.reference || '')}</b>
        <p>${escape(d?.reflection || '')}</p>
      </div>

      <button class="primary" data-p="devotional">
        🙏 Abrir Palavra do Dia
      </button>
    </section>

    <div class="grid">
      <button class="card" data-p="bible">
        📖
        <b>Bíblia Offline</b>
        <small>Leitura, capítulos e busca</small>
      </button>

      <button class="card" data-p="devotional">
        🌅
        <b>Palavra do Dia</b>
        <small>Reflexão e oração</small>
      </button>

      <button class="card" data-p="sermon">
        🎙️
        <b>Pregação</b>
        <small>Mensagem diária ~30 min</small>
      </button>

      <button class="card" data-p="notifications">
        🔔
        <b>Notificações</b>
        <small>Sino diário</small>
      </button>
    </div>

    <div class="notice">
      <b>Modo offline</b><br>
      <span>
        A Bíblia e os devocionais ficam dentro do aplicativo.
      </span>
    </div>
  `;
}

function devotional() {
  const d = today();

  const fav =
    state.favorites.includes(d?.reference);

  return `
    <section class="section">
      <small>PALAVRA DO DIA</small>

      <h2>${escape(d?.theme || '')}</h2>

      <div class="reader">
        <button
          class="fav"
          data-fav="${escape(d?.reference || '')}"
        >
          ${fav ? '♥' : '♡'}
        </button>

        <b>${escape(d?.reference || '')}</b>

        <p>${escape(d?.reflection || '')}</p>

        <p>
          <b>Pratique:</b>
          ${escape(d?.action || '')}
        </p>

        <p>
          <b>Oração:</b>
          ${escape(d?.prayer || '')}
        </p>
      </div>

      <button class="primary" data-p="sermon">
        🎙️ Ouvir / ler a Pregação
      </button>
    </section>
  `;
}

function sermon() {
  const d = today();

  return `
    <section class="section">
      <small>PREGAÇÃO DO DIA</small>

      <h2>${escape(d?.sermonTitle || '')}</h2>

      <div class="timer" id="timer">
        30:00
      </div>

      <div class="toolbar">
        <button class="secondary" id="start">
          ▶ Cronômetro 30 min
        </button>

        <button class="secondary" id="speak">
          🔊 Ouvir pregação
        </button>

        <button class="secondary" id="stopSpeak">
          ⏹ Parar voz
        </button>
      </div>

      <div class="notice">
        <b>Mensagem original do dia</b><br>
        <span>
          Use "Ouvir pregação" para reproduzir a mensagem
          usando a voz do Android.
        </span>
      </div>

      <article class="reader sermon">
        ${escape(d?.sermon || '')}
      </article>
    </section>
  `;
}

function biblePage() {
  const book = books[selectedBook];

  return `
    <section class="section">
      <small>BÍBLIA SAGRADA</small>

      <h2>📖 Bíblia Offline</h2>

      <div class="toolbar">
        <select id="book">
          ${books.map((b, i) => `
            <option
              value="${i}"
              ${i === selectedBook ? 'selected' : ''}
            >
              ${escape(b.name)}
            </option>
          `).join('')}
        </select>

        <select id="chapter">
          ${Array.from(
            { length: book?.chapters || 1 },
            (_, i) => `
              <option
                value="${i + 1}"
                ${i + 1 === selectedChapter ? 'selected' : ''}
              >
                ${i + 1}
              </option>
            `
          ).join('')}
        </select>
      </div>

      <input
        id="search"
        class="search"
        placeholder="Buscar palavra na Bíblia"
      >

      <button class="primary" id="openChapter">
        Abrir capítulo
      </button>

      <div id="chapterView" class="reader">
        <span>
          Escolha livro e capítulo.
        </span>
      </div>
    </section>
  `;
}

function favorites() {
  return `
    <section class="section">
      <h2>❤️ Favoritos</h2>

      <div class="reader">
        ${
          state.favorites.length
            ? state.favorites
                .map(x => `<p>♥ ${escape(x)}</p>`)
                .join('')
            : '<span>Nenhum versículo favorito.</span>'
        }
      </div>
    </section>
  `;
}

function notifications() {
  state.notifications.forEach(
    n => n.seen = true
  );

  save();

  return `
    <section class="section">
      <h2>🔔 Notificações</h2>

      <div class="reader">
        ${
          state.notifications.length
            ? state.notifications
                .map(n => `<p>${escape(n.text)}</p>`)
                .join('')
            : '<span>Nenhuma notificação.</span>'
        }
      </div>

      <button
        class="primary"
        id="enableNotifications"
      >
        Ativar notificações diárias
      </button>
    </section>
  `;
}

function render() {
  let c;

  if (page === 'home') c = home();
  else if (page === 'bible') c = biblePage();
  else if (page === 'devotional') c = devotional();
  else if (page === 'sermon') c = sermon();
  else if (page === 'notifications') c = notifications();
  else c = favorites();

  $('#app').innerHTML = layout(c);

  badge();

  document
    .querySelectorAll('[data-p]')
    .forEach(b => {
      b.onclick = () =>
        nav(b.dataset.p);
    });

  const bell = $('#bell');

  if (bell) {
    bell.onclick = () =>
      nav('notifications');
  }

  bind();
}

function bind() {
  const fav = $('[data-fav]');

  if (fav) {
    fav.onclick = () => {
      const r = fav.dataset.fav;

      state.favorites =
        state.favorites.includes(r)
          ? state.favorites.filter(x => x !== r)
          : [...state.favorites, r];

      save();
      render();
    };
  }

  const ob = $('#openChapter');

  if (ob) {
    ob.onclick = openChapter;
  }

  const bk = $('#book');

  if (bk) {
    bk.onchange = () => {
      selectedBook = +bk.value;
      selectedChapter = 1;
      render();
    };
  }

  const ch = $('#chapter');

  if (ch) {
    ch.onchange = () => {
      selectedChapter = +ch.value;
    };
  }

  const sr = $('#search');

  if (sr) {
    sr.onkeydown = e => {
      if (e.key === 'Enter') {
        searchBible(sr.value);
      }
    };
  }

  const st = $('#start');

  if (st) {
    st.onclick = startTimer;
  }

  const sp = $('#speak');

  if (sp) {
    sp.onclick = speakSermon;
  }

  const stop = $('#stopSpeak');

  if (stop) {
    stop.onclick = stopSermon;
  }

  const en = $('#enableNotifications');

  if (en) {
    en.onclick = enableNotifications;
  }
}

function openChapter() {
  const b = books[selectedBook];
  const ch = selectedChapter;

  let html =
    '<h3>' +
    escape(b.name) +
    ' ' +
    ch +
    '</h3>';

  const data =
    findChapter(b.abbr, ch);

  if (data?.length) {
    html += data
      .map(v => `
        <p>
          <sup>
            ${escape(
              v.n ||
              v.number ||
              v.verse ||
              ''
            )}
          </sup>

          ${escape(v.text)}
        </p>
      `)
      .join('');
  } else {
    html += `
      <p>
        O capítulo não foi encontrado
        no banco bíblico local.
      </p>
    `;
  }

  $('#chapterView').innerHTML = html;

  state.read[
    `${b.abbr}.${ch}`
  ] = Date.now();

  save();
}

function findChapter(abbr, ch) {
  if (!bible) return null;

  const booksArr =
    bible.books || bible;

  const b =
    booksArr.find(
      x =>
        (x.abbreviation ||
          x.abbr ||
          x.id ||
          x.name) === abbr ||
        x.name === books[selectedBook].name
    );

  return (
    b?.chapters?.[ch - 1]?.verses ||
    b?.chapters?.[ch - 1] ||
    null
  );
}

function searchBible(q) {
  q = q.trim().toLowerCase();

  if (!q) return;

  let hits = [];

  const arr =
    bible?.books ||
    bible ||
    [];

  for (const b of arr) {
    for (
      let ci = 0;
      ci < (b.chapters || []).length;
      ci++
    ) {
      for (
        const v of
        ((b.chapters[ci]?.verses) || [])
      ) {
        if (
          String(v.text || '')
            .toLowerCase()
            .includes(q)
        ) {
          hits.push(
            `${b.name || b.abbr} ` +
            `${ci + 1}:` +
            `${v.verse || v.number || ''}` +
            ` — ${v.text}`
          );
        }

        if (hits.length >= 30) break;
      }

      if (hits.length >= 30) break;
    }

    if (hits.length >= 30) break;
  }

  $('#chapterView').innerHTML =
    '<h3>Resultados</h3>' +
    (
      hits.length
        ? hits.map(h =>
            `<p>${escape(h)}</p>`
          ).join('')
        : '<p>Nenhum resultado.</p>'
    );
}

function startTimer() {
  clearInterval(timer);

  seconds = 1800;

  const el = $('#timer');

  if (!el) return;

  el.textContent = '30:00';

  timer = setInterval(() => {
    seconds--;

    if (seconds < 0) {
      clearInterval(timer);
      return;
    }

    el.textContent =
      String(Math.floor(seconds / 60))
        .padStart(2, '0') +
      ':' +
      String(seconds % 60)
        .padStart(2, '0');
  }, 1000);
}

async function speakSermon() {
  const d = today();

  const text = d?.sermon || '';

  if (!text) {
    alert('A pregação de hoje não está disponível.');
    return;
  }

  try {
    await TextToSpeech.stop();

    speaking = true;

    const chunks = splitText(text);

    for (const chunk of chunks) {
      if (!speaking) break;

      await TextToSpeech.speak({
        text: chunk,
        lang: 'pt-BR',
        rate: 0.9,
        pitch: 1.0,
        volume: 1.0,
        queueStrategy: 1
      });
    }

    speaking = false;

  } catch (e) {
    speaking = false;

    alert(
      'Não foi possível iniciar a voz do Android. ' +
      'Verifique o volume e o mecanismo de voz do aparelho.'
    );
  }
}

function splitText(text) {
  const sentences =
    text.match(/[^.!?]+[.!?]+/g) ||
    [text];

  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if (
      (current + sentence).length > 900
    ) {
      if (current) {
        chunks.push(current);
      }

      current = sentence;
    } else {
      current += sentence;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

async function stopSermon() {
  speaking = false;

  try {
    await TextToSpeech.stop();
  } catch (e) {
    console.log(e);
  }
}

async function enableNotifications() {
  try {
    const p =
      await LocalNotifications.requestPermissions();

    if (p.display !== 'granted') {
      alert(
        'Permissão de notificação não concedida.'
      );
      return;
    }

    await LocalNotifications.cancel({
      notifications: [
        { id: 1001 }
      ]
    });

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1001,
          title: 'Palavra do Dia',
          body:
            'Sua Palavra do Dia e sua pregação já estão disponíveis.',
          schedule: {
            on: {
              hour: 8,
              minute: 0
            },
            allowWhileIdle: true
          }
        }
      ]
    });

    addNotif(
      'Sino diário ativado para 08:00.'
    );

    alert(
      'Notificações diárias ativadas.'
    );

  } catch (e) {
    console.error(e);

    alert(
      'Não foi possível ativar as notificações. ' +
      'Permita notificações nas configurações do aplicativo.'
    );
  }
}

async function loadBible() {
  try {
    const response =
      await fetch('/bible.json');

    if (!response.ok) {
      throw new Error(
        'bible.json não encontrado'
      );
    }

    bible =
      await response.json();

  } catch (e) {
    console.error(
      'Erro ao carregar Bíblia:',
      e
    );

    bible = null;
  }
}

async function loadData() {
  try {
    const results =
      await Promise.all([
        fetch('/books.json').then(r => r.json()),
        fetch('/daily.json').then(r => r.json())
      ]);

    books = results[0];
    daily = results[1];

    await loadBible();

    if (!state.notifications.length) {
      addNotif(
        'Sua Palavra do Dia está pronta.'
      );
    }

    render();

  } catch (e) {
    console.error(e);

    $('#app').innerHTML = `
      <section class="section">
        <h2>Erro ao carregar o aplicativo</h2>
        <p>
          Verifique os arquivos da pasta public.
        </p>
      </section>
    `;
  }
}

loadData();
