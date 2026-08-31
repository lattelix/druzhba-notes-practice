const form = document.getElementById('assessment-form');
const formError = document.getElementById('form-error');
const emptyResult = document.getElementById('empty-result');
const assessmentResult = document.getElementById('assessment-result');
const verdict = document.getElementById('verdict');
const verdictDescription = document.getElementById('verdict-description');
const score = document.getElementById('score');
const workstationsPercent = document.getElementById('workstations-percent');
const networkPercent = document.getElementById('network-percent');
const criticalRisks = document.getElementById('critical-risks');
const reasoningLog = document.getElementById('reasoning-log');

const rules = [
  {
    id: 'R1',
    when: (facts) => facts.workstationsRatio === 1,
    derive: { workstationsReady: true },
    message: 'Все рабочие места прошли проверку.',
  },
  {
    id: 'R2',
    when: (facts) => facts.workstationsRatio >= 0.9 && facts.workstationsRatio < 1,
    derive: { workstationsWarning: true },
    message: 'Работоспособны не менее 90 процентов рабочих мест, требуется локальный ремонт.',
  },
  {
    id: 'R3',
    when: (facts) => facts.workstationsRatio < 0.9,
    derive: { workstationsCritical: true, criticalInfrastructureRisk: true },
    message: 'Неисправно более 10 процентов рабочих мест.',
  },
  {
    id: 'R4',
    when: (facts) => facts.networkRatio === 1,
    derive: { networkReady: true },
    message: 'Все проверенные сетевые узлы работают.',
  },
  {
    id: 'R5',
    when: (facts) => facts.networkRatio >= 0.9 && facts.networkRatio < 1,
    derive: { networkWarning: true },
    message: 'Сеть работоспособна, но один из узлов требует обслуживания.',
  },
  {
    id: 'R6',
    when: (facts) => facts.networkRatio < 0.9,
    derive: { networkCritical: true, criticalInfrastructureRisk: true },
    message: 'Доля работоспособных сетевых узлов ниже допустимого уровня.',
  },
  {
    id: 'R7',
    when: (facts) => facts.backupStatus === 'tested',
    derive: { backupReady: true },
    message: 'Резервная копия создана и проверена восстановлением контрольного файла.',
  },
  {
    id: 'R8',
    when: (facts) => facts.backupStatus === 'configured',
    derive: { backupWarning: true },
    message: 'Резервное копирование настроено, но восстановление не проверено.',
  },
  {
    id: 'R9',
    when: (facts) => facts.backupStatus === 'missing',
    derive: { backupCritical: true, criticalInfrastructureRisk: true },
    message: 'Резервное копирование отсутствует.',
  },
  {
    id: 'R10',
    when: (facts) => facts.securityStatus === 'complete',
    derive: { securityReady: true },
    message: 'Роли, пароли и неиспользуемые учетные записи проверены.',
  },
  {
    id: 'R11',
    when: (facts) => facts.securityStatus === 'partial',
    derive: { securityWarning: true },
    message: 'Проверка учетных записей завершена частично.',
  },
  {
    id: 'R12',
    when: (facts) => facts.securityStatus === 'missing',
    derive: { securityCritical: true, criticalInfrastructureRisk: true },
    message: 'Контроль учетных записей не выполнен.',
  },
];

function readInput() {
  return {
    objectName: document.getElementById('object-name').value.trim(),
    workstationsTotal: Number(document.getElementById('workstations-total').value),
    workstationsReadyCount: Number(document.getElementById('workstations-ready').value),
    networkTotal: Number(document.getElementById('network-total').value),
    networkReadyCount: Number(document.getElementById('network-ready').value),
    backupStatus: document.getElementById('backup-status').value,
    securityStatus: document.getElementById('security-status').value,
  };
}

function validate(input) {
  if (!input.objectName) return 'Укажите проверяемый объект.';
  if (!Number.isInteger(input.workstationsTotal) || input.workstationsTotal <= 0) return 'Проверьте число рабочих мест.';
  if (!Number.isInteger(input.workstationsReadyCount) || input.workstationsReadyCount < 0 || input.workstationsReadyCount > input.workstationsTotal) return 'Число исправных рабочих мест указано неверно.';
  if (!Number.isInteger(input.networkTotal) || input.networkTotal <= 0) return 'Проверьте число сетевых узлов.';
  if (!Number.isInteger(input.networkReadyCount) || input.networkReadyCount < 0 || input.networkReadyCount > input.networkTotal) return 'Число работоспособных сетевых узлов указано неверно.';
  return '';
}

function infer(input) {
  const facts = {
    ...input,
    workstationsRatio: input.workstationsReadyCount / input.workstationsTotal,
    networkRatio: input.networkReadyCount / input.networkTotal,
  };
  const firedRules = [];

  let changed = true;
  while (changed) {
    changed = false;
    for (const rule of rules) {
      if (firedRules.some((firedRule) => firedRule.id === rule.id) || !rule.when(facts)) continue;
      Object.assign(facts, rule.derive);
      firedRules.push(rule);
      changed = true;
    }
  }

  return { facts, firedRules };
}

function getVerdict(facts) {
  if (facts.criticalInfrastructureRisk) {
    return {
      level: 'risk',
      title: 'Объект не готов к эксплуатации',
      description: 'До допуска пользователей необходимо устранить критические инфраструктурные риски.',
      score: 30,
    };
  }

  const positiveSignals = [
    facts.workstationsReady,
    facts.networkReady,
    facts.backupReady,
    facts.securityReady,
  ].filter(Boolean).length;
  const calculatedScore = Math.round((positiveSignals / 4) * 100);

  if (
    facts.workstationsReady && facts.networkReady && facts.backupReady && facts.securityReady
  ) {
    return {
      level: 'good',
      title: 'IT-инфраструктура готова',
      description: 'Рабочие места, сеть, резервное копирование и учетные записи прошли контроль.',
      score: calculatedScore,
    };
  }

  return {
    level: 'warning',
    title: 'Готовность подтверждена с замечаниями',
    description: 'До начала смены нужно закрыть замечания, перечисленные в цепочке вывода.',
    score: calculatedScore,
  };
}

function render(result) {
  const recommendation = getVerdict(result.facts);
  emptyResult.classList.add('hidden');
  assessmentResult.classList.remove('hidden');

  verdict.textContent = recommendation.title;
  verdict.dataset.level = recommendation.level;
  verdictDescription.textContent = recommendation.description;
  score.textContent = `${recommendation.score}/100`;
  score.dataset.level = recommendation.level;
  workstationsPercent.textContent = `${Math.round(result.facts.workstationsRatio * 100)}%`;
  networkPercent.textContent = `${Math.round(result.facts.networkRatio * 100)}%`;
  criticalRisks.textContent = String([
    result.facts.workstationsCritical,
    result.facts.networkCritical,
    result.facts.backupCritical,
    result.facts.securityCritical,
  ].filter(Boolean).length);

  reasoningLog.replaceChildren(
    ...result.firedRules.map((rule) => {
      const item = document.createElement('li');
      const code = document.createElement('strong');
      code.textContent = rule.id;
      item.append(code, document.createTextNode(` ${rule.message}`));
      return item;
    }),
  );
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = readInput();
  const error = validate(input);
  formError.textContent = error;
  if (error) return;
  render(infer(input));
});
