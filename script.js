// StudyVerse - Lógica JavaScript Principal

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. MODO OSCURO / CLARO
  // ==========================================
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  
  themeToggleBtn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
  });

  // ==========================================
  // 2. CARRUSEL DE PRESENTACIÓN
  // ==========================================
  const slides = document.querySelectorAll('.carousel-slide');
  const indicators = document.querySelectorAll('.carousel-indicator');
  let currentSlide = 0;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      if (i === index) {
        slide.classList.remove('opacity-0', 'translate-x-full');
        slide.classList.add('opacity-100', 'translate-x-0');
      } else {
        slide.classList.remove('opacity-100', 'translate-x-0');
        slide.classList.add('opacity-0', 'translate-x-full');
      }
    });

    indicators.forEach((dot, i) => {
      if (i === index) {
        dot.classList.add('bg-indigo-600');
        dot.classList.remove('bg-slate-300', 'dark:bg-slate-600');
      } else {
        dot.classList.remove('bg-indigo-600');
        dot.classList.add('bg-slate-300', 'dark:bg-slate-600');
      }
    });

    currentSlide = index;
  }

  indicators.forEach(dot => {
    dot.addEventListener('click', (e) => {
      const slideIndex = parseInt(e.target.dataset.slide);
      showSlide(slideIndex);
    });
  });

  // Rotación automática del carrusel cada 5 segundos
  setInterval(() => {
    let nextIndex = (currentSlide + 1) % slides.length;
    showSlide(nextIndex);
  }, 5000);

  // ==========================================
  // 3. LECTURA DE ARCHIVOS (PDF, DOCX, TXT)
  // ==========================================
  const fileInput = document.getElementById('fileInput');
  const fileNameDisplay = document.getElementById('fileName');
  const inputText = document.getElementById('inputText');

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    fileNameDisplay.textContent = `Archivo cargado: ${file.name}`;
    fileNameDisplay.classList.remove('hidden');

    const fileType = file.name.split('.').pop().toLowerCase();

    if (fileType === 'txt') {
      const reader = new FileReader();
      reader.onload = (event) => {
        inputText.value = event.target.result;
      };
      reader.readAsText(file);
    } 
    else if (fileType === 'docx') {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const result = await mammoth.extractRawText({ arrayBuffer: event.target.result });
          inputText.value = result.value;
        } catch (err) {
          alert('Error al procesar el archivo Word.');
        }
      };
      reader.readAsArrayBuffer(file);
    } 
    else if (fileType === 'pdf') {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const typedarray = new Uint8Array(event.target.result);
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
          
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let fullText = '';

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
          }

          inputText.value = fullText;
        } catch (err) {
          alert('Error al leer el archivo PDF.');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  });

  // ==========================================
  // 4. RESUMEN Y TRADUCCIÓN SIMULADA
  // ==========================================
  const btnSummarize = document.getElementById('btnSummarize');
  const btnTranslate = document.getElementById('btnTranslate');
  const outputText = document.getElementById('outputText');
  const charCount = document.getElementById('charCount');
  const langSelect = document.getElementById('langSelect');

  btnSummarize.addEventListener('click', () => {
    const text = inputText.value.trim();
    if (!text) {
      alert('Por favor ingresa o carga un texto primero.');
      return;
    }

    const sentences = text.split(/(?<=[.?!])\s+/);
    const summaryLength = Math.max(1, Math.floor(sentences.length * 0.4));
    const summary = sentences.slice(0, summaryLength).join(' ');

    outputText.innerHTML = `<p class="font-semibold text-indigo-600 dark:text-indigo-400 mb-2">[Resumen Generado]</p><p>${summary}</p>`;
    charCount.textContent = `${summary.length} Caracteres`;
  });

  btnTranslate.addEventListener('click', () => {
    const text = inputText.value.trim();
    if (!text) {
      alert('Por favor ingresa o carga un texto primero.');
      return;
    }

    const targetLang = langSelect.options[langSelect.selectedIndex].text;
    outputText.innerHTML = `<p class="font-semibold text-sky-600 dark:text-sky-400 mb-2">[Traducción al ${targetLang}]</p><p>${text}</p>`;
    charCount.textContent = `${text.length} Caracteres`;
  });

  // ==========================================
  // 5. LECTOR DE VOZ (TEXT-TO-SPEECH)
  // ==========================================
  const btnPlayText = document.getElementById('btnPlayText');
  const btnStopText = document.getElementById('btnStopText');
  const speechStatus = document.getElementById('speechStatus');

  const synth = window.speechSynthesis;
  let currentUtterance = null;

  btnPlayText.addEventListener('click', () => {
    const textToRead = outputText.innerText;
    if (!textToRead || textToRead.includes('El resultado de tu resumen')) {
      alert('No hay información generada para leer.');
      return;
    }

    synth.cancel();

    currentUtterance = new SpeechSynthesisUtterance(textToRead);
    currentUtterance.lang = langSelect.value || 'es';

    currentUtterance.onstart = () => {
      speechStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Leyendo...';
    };

    currentUtterance.onend = () => {
      speechStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-slate-400"></span> Listo';
    };

    synth.speak(currentUtterance);
  });

  btnStopText.addEventListener('click', () => {
    synth.cancel();
    speechStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-slate-400"></span> Listo';
  });

  // ==========================================
  // 6. TEMPORIZADOR BLOQUES DE ESTUDIO (POMODORO)
  // ==========================================
  let timer;
  let timeLeft = 25 * 60;
  let isRunning = false;

  const timerDisplay = document.getElementById('timerDisplay');
  const btnStartTimer = document.getElementById('btnStartTimer');
  const btnPauseTimer = document.getElementById('btnPauseTimer');
  const btnResetTimer = document.getElementById('btnResetTimer');

  const modePomodoro = document.getElementById('modePomodoro');
  const modeShortBreak = document.getElementById('modeShortBreak');
  const modeLongBreak = document.getElementById('modeLongBreak');

  function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  function setTimerMode(minutes, activeBtn) {
    clearInterval(timer);
    isRunning = false;
    timeLeft = minutes * 60;
    updateTimerDisplay();

    [modePomodoro, modeShortBreak, modeLongBreak].forEach(btn => {
      btn.classList.remove('bg-indigo-600', 'text-white');
      btn.classList.add('bg-slate-200', 'dark:bg-slate-700', 'text-slate-700', 'dark:text-slate-300');
    });

    activeBtn.classList.remove('bg-slate-200', 'dark:bg-slate-700', 'text-slate-700', 'dark:text-slate-300');
    activeBtn.classList.add('bg-indigo-600', 'text-white');
  }

  modePomodoro.addEventListener('click', () => setTimerMode(25, modePomodoro));
  modeShortBreak.addEventListener('click', () => setTimerMode(5, modeShortBreak));
  modeLongBreak.addEventListener('click', () => setTimerMode(15, modeLongBreak));

  btnStartTimer.addEventListener('click', () => {
    if (isRunning) return;
    isRunning = true;
    timer = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        updateTimerDisplay();
      } else {
        clearInterval(timer);
        isRunning = false;
        alert('¡Tiempo cumplido! Toma tu descanso.');
      }
    }, 1000);
  });

  btnPauseTimer.addEventListener('click', () => {
    clearInterval(timer);
    isRunning = false;
  });

  btnResetTimer.addEventListener('click', () => {
    clearInterval(timer);
    isRunning = false;
    timeLeft = 25 * 60;
    updateTimerDisplay();
  });

  // ==========================================
  // 7. PLANIFICADOR DE TAREAS (TO-DO LIST)
  // ==========================================
  const taskInput = document.getElementById('taskInput');
  const btnAddTask = document.getElementById('btnAddTask');
  const taskList = document.getElementById('taskList');

  btnAddTask.addEventListener('click', addTask);
  taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });

  function addTask() {
    const taskText = taskInput.value.trim();
    if (!taskText) return;

    const li = document.createElement('li');
    li.className = 'flex items-center justify-between p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all';
    
    li.innerHTML = `
      <div class="flex items-center gap-3">
        <input type="checkbox" class="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer">
        <span class="text-sm font-medium text-slate-700 dark:text-slate-200">${taskText}</span>
      </div>
      <button class="delete-btn text-slate-400 hover:text-red-500 transition-colors">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;

    const checkbox = li.querySelector('input');
    const span = li.querySelector('span');
    checkbox.addEventListener('change', () => {
      span.classList.toggle('line-through');
      span.classList.toggle('text-slate-400');
    });

    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => li.remove());

    taskList.appendChild(li);
    taskInput.value = '';
  }

});