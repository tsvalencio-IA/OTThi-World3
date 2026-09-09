(() => {
  'use strict';
  const KEY = 'otthi_adaptive_learning_v1';
  const defaults = () => ({
    schema:1, streak:0, totalAnswered:0, updatedAt:0,
    subjects:{
      addition:{ name:'Adição', icon:'➕', mastery:20, correct:0, attempts:0 },
      subtraction:{ name:'Subtração', icon:'➖', mastery:15, correct:0, attempts:0 },
      multiplication:{ name:'Multiplicação', icon:'✖️', mastery:8, correct:0, attempts:0 },
      division:{ name:'Divisão', icon:'➗', mastery:5, correct:0, attempts:0 },
      logic:{ name:'Lógica', icon:'🧩', mastery:10, correct:0, attempts:0 }
    }
  });
  let state = load();
  let session = null;

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      const base = defaults();
      if (!saved) return base;
      return { ...base, ...saved, subjects:{ ...base.subjects, ...(saved.subjects || {}) } };
    } catch { return defaults(); }
  }
  function save() {
    state.updatedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
    window.OTTHOS_RTDB?.syncLearning?.(state);
    window.dispatchEvent(new CustomEvent('otthi:learning-updated', { detail:summary() }));
  }
  function summary() {
    const subjects = Object.fromEntries(Object.entries(state.subjects).map(([id, item]) => [id, { ...item }]));
    const average = Math.round(Object.values(subjects).reduce((sum, item) => sum + Number(item.mastery || 0), 0) / Math.max(1, Object.keys(subjects).length));
    return { ...state, subjects, average };
  }
  function difficulty(mastery) { return mastery < 25 ? 1 : mastery < 50 ? 2 : mastery < 75 ? 3 : 4; }
  function options(answer) {
    const set = new Set([answer]);
    let step = 1;
    while (set.size < 4) {
      const sign = set.size % 2 ? 1 : -1;
      set.add(Math.max(0, answer + sign * step));
      step += 1 + Math.floor(answer / 10);
    }
    return [...set].sort(() => Math.random() - .5);
  }
  function question(subjectId) {
    const subject = state.subjects[subjectId] || state.subjects.addition;
    const level = difficulty(subject.mastery);
    let a=0,b=0,answer=0,text='';
    if (subjectId === 'addition') { a=2+Math.floor(Math.random()*(8*level)); b=1+Math.floor(Math.random()*(7*level)); answer=a+b; text=`${a} + ${b}`; }
    else if (subjectId === 'subtraction') { a=5+Math.floor(Math.random()*(10*level)); b=Math.floor(Math.random()*a); answer=a-b; text=`${a} − ${b}`; }
    else if (subjectId === 'multiplication') { a=2+Math.floor(Math.random()*(2+level*2)); b=2+Math.floor(Math.random()*(3+level*2)); answer=a*b; text=`${a} × ${b}`; }
    else if (subjectId === 'division') { b=2+Math.floor(Math.random()*(2+level)); answer=1+Math.floor(Math.random()*(3+level*2)); a=b*answer; text=`${a} ÷ ${b}`; }
    else { const sequence=[1,2,4,8,16,32].slice(0,Math.min(3+level,6)); answer=sequence[sequence.length-1]*2; text=`Complete: ${sequence.join(', ')}, ?`; }
    return { subjectId, text, answer, options:options(answer), level };
  }
  function record(subjectId, correct) {
    const item = state.subjects[subjectId];
    item.attempts += 1; state.totalAnswered += 1;
    if (correct) { item.correct += 1; item.mastery = Math.min(100, item.mastery + Math.max(2, 7 - difficulty(item.mastery))); state.streak += 1; }
    else { item.mastery = Math.max(0, item.mastery - 2); state.streak = 0; }
    save();
  }
  function hubHtml() {
    const s = summary();
    return `<section class="learning-hub"><div class="learning-summary"><div><small>DOMÍNIO MÉDIO</small><b>${s.average}%</b></div><div><small>SEQUÊNCIA</small><b>${s.streak} 🔥</b></div><div><small>RESPOSTAS</small><b>${s.totalAnswered}</b></div></div><p>Os desafios ficam mais difíceis conforme a criança aprende. As recompensas continuam ligadas ao mundo aberto.</p><div class="learning-subjects">${Object.entries(s.subjects).map(([id,item])=>`<button type="button" data-subject="${id}"><span>${item.icon}</span><b>${item.name}</b><small>${Math.round(item.mastery)}% dominado</small><i><em style="width:${Math.round(item.mastery)}%"></em></i></button>`).join('')}</div></section>`;
  }
  function openHub() {
    window.OTTHI_MODAL?.open('Trilha de Aprendizado', hubHtml(), root => {
      root.querySelectorAll('[data-subject]').forEach(button => button.addEventListener('click', () => start(button.dataset.subject)));
    });
  }
  function start(subjectId) {
    session = { subjectId, index:0, total:5, score:0, current:null };
    next();
  }
  function next() {
    if (!session) return;
    if (session.index >= session.total) return finish();
    session.current = question(session.subjectId);
    const item = state.subjects[session.subjectId];
    window.OTTHI_MODAL?.open(`${item.icon} ${item.name}`, `<section class="adaptive-question"><small>DESAFIO ${session.index+1} DE ${session.total} • NÍVEL ${session.current.level}</small><h3>${session.current.text}</h3><div class="adaptive-options">${session.current.options.map(value=>`<button type="button" data-answer="${value}">${value}</button>`).join('')}</div><p data-feedback aria-live="polite"></p></section>`, root => {
      root.querySelectorAll('[data-answer]').forEach(button => button.addEventListener('click', () => answer(Number(button.dataset.answer), root)));
    });
  }
  function answer(value, root) {
    if (!session?.current) return;
    const correct = value === session.current.answer;
    record(session.subjectId, correct);
    if (correct) session.score += 1;
    root.querySelectorAll('[data-answer]').forEach(button => { button.disabled=true; button.classList.toggle('correct', Number(button.dataset.answer)===session.current.answer); button.classList.toggle('wrong', Number(button.dataset.answer)===value&&!correct); });
    const feedback=root.querySelector('[data-feedback]'); if(feedback)feedback.textContent=correct?'Muito bem!':'A resposta correta está destacada.';
    session.index += 1; setTimeout(next, 850);
  }
  function finish() {
    const result = { score:session.score, total:session.total, subjectId:session.subjectId };
    session = null;
    window.OTTHI_MODAL?.open('Desafio concluído', `<section class="learning-result"><div>${result.score>=4?'🏆':'🌟'}</div><h3>${result.score}/${result.total}</h3><p>O progresso foi salvo. Continue explorando o mundo para transformar aprendizado em recompensas.</p><button type="button" class="btn primary" data-learning-back>Voltar à trilha</button></section>`, root => root.querySelector('[data-learning-back]')?.addEventListener('click', openHub));
    window.dispatchEvent(new CustomEvent('otthi:learning-session-finished',{detail:result}));
  }
  async function cloudMerge() {
    const cloud = await window.OTTHOS_RTDB?.loadLearning?.();
    if (!cloud?.subjects) return false;
    for (const [id,item] of Object.entries(cloud.subjects)) {
      if (!state.subjects[id]) continue;
      if (Number(item.attempts||0) > Number(state.subjects[id].attempts||0)) state.subjects[id] = { ...state.subjects[id], ...item };
    }
    state.streak=Math.max(state.streak,Number(cloud.streak||0));state.totalAnswered=Math.max(state.totalAnswered,Number(cloud.totalAnswered||0));save();return true;
  }
  function bind() {
    document.getElementById('learningPathBtn')?.addEventListener('click', openHub);
    document.getElementById('learningPathQuickBtn')?.addEventListener('click', openHub);
    addEventListener('otthos:account', cloudMerge);
  }
  document.addEventListener('DOMContentLoaded', bind, { once:true });
  window.OTTHI_LEARNING = { open:openHub, start, question, record, summary, sync:cloudMerge };
})();
