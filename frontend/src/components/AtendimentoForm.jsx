import { CalendarDays, CircleDollarSign, FileText, IdCard, Mail, Phone, User } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useData } from '../contexts/DataContext.jsx';
import Button from './Button.jsx';
import Input from './Input.jsx';

const initialState = {
  dataAtendimento: '',
  valorRecebido: '',
  pagadorNome: '',
  pagadorDoc: '',
  pacienteMesmoPagador: false,
  pacienteNome: '',
  pacienteCpf: '',
  pacienteTelefone: '',
  pacienteEmail: '',
  formaPagamento: 'PIX',
  precisaDoc: false,
  observacoes: ''
};

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function parseBrazilianCurrency(value) {
  const normalized = String(value || '').replace(/\./g, '').replace(',', '.');
  return Number(normalized);
}

function formatCurrencyInput(value) {
  const num = parseBrazilianCurrency(value);
  if (!num || num <= 0) return value;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getCompetencia(date) {
  if (!date) return '';
  const [year, month] = date.split('-');
  return `${month}/${year}`;
}

function maskPhone(value) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)})${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)})${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)})${d.slice(2, 7)}-${d.slice(7)}`;
}

function isValidPhone(value) {
  const d = onlyDigits(value);
  return d.length === 10 || d.length === 11;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function maskCpf(value) {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function maskCpfCnpj(value) {
  const d = onlyDigits(value);
  if (d.length <= 11) {
    return d.slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return d.slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function formatCpf(digits) {
  return maskCpf(digits);
}

function dateToBR(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function dateInputValue(value) {
  if (!value) return '';
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const [d, m, y] = text.split('/');
  if (!d || !m || !y) return '';
  return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function currencyInputValue(value) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  const clean = String(value).replace(/[^\d,.-]/g, '').trim();
  if (!clean) return '';
  const normalized = clean.includes(',') ? clean.replace(/\./g, '').replace(',', '.') : clean;
  const num = Number(normalized);
  if (!Number.isFinite(num)) return String(value);
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function normalizeInitialValues(values, pacientes) {
  if (!values) return initialState;

  const cpfPaciente = values.pacienteCpf || values.cpfPaciente || '';
  const cpfPagador = values.pagadorDoc || values.cpfPagador || '';
  const pacienteRef = pacientes.find((p) => onlyDigits(p.cpf) === onlyDigits(cpfPaciente));
  const pacienteNome = values.pacienteNome || values.paciente || pacienteRef?.nome || '';
  const pagadorNome = values.pagadorNome || values.pagador || '';
  const pacienteCpf = maskCpf(cpfPaciente || pacienteRef?.cpf || '');
  const pagadorDoc = maskCpfCnpj(cpfPagador);
  const samePerson = typeof values.pacienteMesmoPagador === 'boolean'
    ? values.pacienteMesmoPagador
    : Boolean(
        onlyDigits(pacienteCpf) &&
        onlyDigits(pacienteCpf) === onlyDigits(pagadorDoc) &&
        pacienteNome.trim().toLowerCase() === pagadorNome.trim().toLowerCase()
      );

  return {
    ...initialState,
    dataAtendimento: dateInputValue(values.dataAtendimento || values.data),
    valorRecebido: currencyInputValue(values.valorRecebido ?? values.valorNum ?? values.valor),
    pagadorNome,
    pagadorDoc,
    pacienteMesmoPagador: samePerson,
    pacienteNome,
    pacienteCpf,
    pacienteTelefone: maskPhone(values.pacienteTelefone || values.telefone || pacienteRef?.telefone || ''),
    pacienteEmail: values.pacienteEmail || values.email || pacienteRef?.email || '',
    formaPagamento: values.formaPagamento || initialState.formaPagamento,
    precisaDoc: typeof values.precisaDoc === 'boolean'
      ? values.precisaDoc
      : Boolean(values.nfStatus && values.nfStatus !== 'emitido'),
    observacoes: values.observacoes || '',
    servico: values.servico || 'Consulta',
  };
}

function AutocompleteField({ label, icon, placeholder, value, error, readOnly, onChange, onSelect, pacientes }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (q.length < 2) return [];
    return pacientes.filter((p) => p.nome.toLowerCase().includes(q)).slice(0, 6);
  }, [value, pacientes]);

  useEffect(() => {
    function handleOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <Input
        label={label}
        icon={icon}
        placeholder={placeholder}
        value={value}
        error={error}
        readOnly={readOnly}
        onChange={(e) => { onChange(e); setOpen(true); }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="autocomplete-dropdown">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              className="autocomplete-item"
              onMouseDown={(e) => { e.preventDefault(); onSelect(p); setOpen(false); }}
            >
              <span className="autocomplete-item-name">{p.nome}</span>
              <span className="autocomplete-item-cpf">{p.cpf}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AtendimentoForm({ initialValues, onCancel, onSubmit }) {
  const { pacientes, addPaciente } = useData();
  const [form, setForm] = useState(() => normalizeInitialValues(initialValues, pacientes));
  const [errors, setErrors] = useState({});
  const [cpfConflict, setCpfConflict] = useState(null);
  const [pagadorConflict, setPagadorConflict] = useState(null);

  const competencia = useMemo(() => getCompetencia(form.dataAtendimento), [form.dataAtendimento]);

  useEffect(() => {
    if (!form.pacienteMesmoPagador) return;
    const found = pacientes.find((p) => onlyDigits(p.cpf) === onlyDigits(form.pagadorDoc));
    setForm((cur) => ({
      ...cur,
      pacienteNome: cur.pagadorNome,
      pacienteCpf: maskCpf(cur.pagadorDoc),
      pacienteTelefone: found?.telefone || cur.pacienteTelefone,
      pacienteEmail: found?.email || cur.pacienteEmail,
    }));
  }, [form.pacienteMesmoPagador, form.pagadorNome, form.pagadorDoc]);

  useEffect(() => {
    const digits = onlyDigits(form.pacienteCpf);
    if (digits.length !== 11) { setCpfConflict(null); return; }
    const existing = pacientes.find((p) => onlyDigits(p.cpf) === digits);
    if (existing && existing.nome.toLowerCase() !== form.pacienteNome.trim().toLowerCase()) {
      setCpfConflict(existing.nome);
    } else {
      setCpfConflict(null);
    }
  }, [form.pacienteCpf, form.pacienteNome, pacientes]);

  useEffect(() => {
    const digits = onlyDigits(form.pagadorDoc);
    if (digits.length !== 11) { setPagadorConflict(null); return; }
    const existing = pacientes.find((p) => onlyDigits(p.cpf) === digits);
    if (existing && existing.nome.toLowerCase() !== form.pagadorNome.trim().toLowerCase()) {
      setPagadorConflict(existing.nome);
    } else {
      setPagadorConflict(null);
    }
  }, [form.pagadorDoc, form.pagadorNome, pacientes]);

  function updateField(field, value) {
    setForm((cur) => ({ ...cur, [field]: value }));
  }

  function selectPaciente(p) {
    setForm((cur) => ({
      ...cur,
      pacienteNome: p.nome,
      pacienteCpf: maskCpf(p.cpf),
      pacienteTelefone: p.telefone || cur.pacienteTelefone,
      pacienteEmail: p.email || cur.pacienteEmail,
    }));
  }

  function selectPagador(p) {
    setForm((cur) => ({
      ...cur,
      pagadorNome: p.nome,
      pagadorDoc: maskCpfCnpj(p.cpf),
    }));
  }

  function validate() {
    const nextErrors = {};
    const valor       = parseBrazilianCurrency(form.valorRecebido);
    const pagadorDoc  = onlyDigits(form.pagadorDoc);
    const pacienteCpf = onlyDigits(form.pacienteCpf);

    if (!form.dataAtendimento)          nextErrors.dataAtendimento = 'Informe a data.';
    if (!valor || valor <= 0)           nextErrors.valorRecebido   = 'Informe um valor maior que zero.';
    if (!form.pagadorNome.trim())       nextErrors.pagadorNome     = 'Informe o nome do pagador.';
    if (![11, 14].includes(pagadorDoc.length))
                                        nextErrors.pagadorDoc      = 'CPF/CNPJ deve ter 11 ou 14 dígitos.';
    else if (pagadorConflict)           nextErrors.pagadorDoc      = `CPF já cadastrado para "${pagadorConflict}".`;
    if (!form.pacienteNome.trim())      nextErrors.pacienteNome    = 'Informe o nome do paciente.';
    if (pacienteCpf.length !== 11)      nextErrors.pacienteCpf     = 'CPF deve ter 11 dígitos.';
    if (cpfConflict)                    nextErrors.pacienteCpf     = `CPF já cadastrado para "${cpfConflict}".`;
    if (!form.pacienteTelefone.trim())  nextErrors.pacienteTelefone = 'Celular do pagador é obrigatório.';
    else if (!isValidPhone(form.pacienteTelefone))
                                        nextErrors.pacienteTelefone = 'Telefone inválido. Ex: (84)98872-7383';
    if (!form.pacienteEmail.trim())     nextErrors.pacienteEmail   = 'E-mail do pagador é obrigatório.';
    else if (!isValidEmail(form.pacienteEmail))
                                        nextErrors.pacienteEmail   = 'E-mail inválido.';
    if (!form.formaPagamento)           nextErrors.formaPagamento  = 'Selecione a forma de pagamento.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    const pacienteCpfDigits = onlyDigits(form.pacienteCpf);
    const alreadyRegistered = pacientes.some((p) => onlyDigits(p.cpf) === pacienteCpfDigits);

    if (!alreadyRegistered && form.pacienteNome.trim()) {
      addPaciente({
        nome: form.pacienteNome.trim(),
        cpf: formatCpf(form.pacienteCpf),
        telefone: form.pacienteTelefone || '',
        email: form.pacienteEmail || '',
        ultimoAtendimento: dateToBR(form.dataAtendimento),
      });
    }

    const payload = {
      ...form,
      competencia,
      valor: parseBrazilianCurrency(form.valorRecebido),
      pagadorDoc: onlyDigits(form.pagadorDoc),
      pacienteCpf: pacienteCpfDigits,
    };

    onSubmit?.(payload);
  }

  const PAGAMENTOS = ['PIX', 'Cartão', 'Dinheiro'];

  return (
    <form className="attendance-form" onSubmit={handleSubmit}>
      <div className="form-grid">

        {/* Data + Valor */}
        <Input
          label="Data do atendimento *"
          type="date"
          icon={CalendarDays}
          value={form.dataAtendimento}
          error={errors.dataAtendimento}
          onChange={(e) => updateField('dataAtendimento', e.target.value)}
        />
        <Input
          label="Valor recebido *"
          icon={CircleDollarSign}
          inputMode="decimal"
          placeholder="150,00"
          value={form.valorRecebido}
          error={errors.valorRecebido}
          onChange={(e) => updateField('valorRecebido', e.target.value)}
          onBlur={() => updateField('valorRecebido', formatCurrencyInput(form.valorRecebido))}
        />

        {/* Competência + Nome do pagador */}
        <Input
          label="Competência"
          icon={FileText}
          value={competencia}
          readOnly
          placeholder="Automática"
        />
        <AutocompleteField
          label="Nome do pagador *"
          icon={User}
          placeholder="Nome completo"
          value={form.pagadorNome}
          error={errors.pagadorNome}
          pacientes={pacientes}
          onChange={(e) => updateField('pagadorNome', e.target.value)}
          onSelect={selectPagador}
        />

        {/* CPF do pagador + checkbox */}
        <Input
          label="CPF/CNPJ do pagador *"
          icon={IdCard}
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={form.pagadorDoc}
          error={errors.pagadorDoc}
          onChange={(e) => updateField('pagadorDoc', maskCpfCnpj(e.target.value))}
        />
        <label className="check-card">
          <input
            type="checkbox"
            checked={form.pacienteMesmoPagador}
            onChange={(e) => updateField('pacienteMesmoPagador', e.target.checked)}
          />
          <span>Paciente é o mesmo do pagador</span>
        </label>

        {/* Nome do paciente + CPF do paciente */}
        <AutocompleteField
          label="Nome do paciente *"
          icon={User}
          placeholder="Nome completo"
          value={form.pacienteNome}
          error={errors.pacienteNome}
          readOnly={form.pacienteMesmoPagador}
          pacientes={pacientes}
          onChange={(e) => updateField('pacienteNome', e.target.value)}
          onSelect={selectPaciente}
        />
        <Input
          label="CPF do paciente *"
          icon={IdCard}
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={form.pacienteCpf}
          error={errors.pacienteCpf}
          readOnly={form.pacienteMesmoPagador}
          onChange={(e) => updateField('pacienteCpf', maskCpf(e.target.value))}
        />

        {/* Celular + E-mail do paciente */}
        <Input
          label="Celular do pagador *"
          icon={Phone}
          inputMode="tel"
          placeholder="(00) 00000-0000"
          value={form.pacienteTelefone}
          error={errors.pacienteTelefone}
          onChange={(e) => updateField('pacienteTelefone', maskPhone(e.target.value))}
        />
        <Input
          label="E-mail do pagador *"
          icon={Mail}
          type="email"
          placeholder="pagador@email.com"
          value={form.pacienteEmail}
          error={errors.pacienteEmail}
          onChange={(e) => updateField('pacienteEmail', e.target.value)}
        />

        {/* Forma de pagamento */}
        <div className="field field-full">
          <span className="field-label">Forma de pagamento *</span>
          <div className="segmented-control" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            {PAGAMENTOS.map((p) => (
              <button
                key={p}
                type="button"
                className={form.formaPagamento === p ? 'active' : ''}
                onClick={() => updateField('formaPagamento', p)}
              >
                {p}
              </button>
            ))}
          </div>
          {errors.formaPagamento && <span className="field-error">{errors.formaPagamento}</span>}
        </div>

        {/* Precisa de NF ou recibo? */}
        <div className="field field-full">
          <span className="field-label">Paciente solicitou NF ou recibo?</span>
          <div className="segmented-control">
            <button
              type="button"
              className={form.precisaDoc ? 'active' : ''}
              onClick={() => updateField('precisaDoc', true)}
            >
              Sim
            </button>
            <button
              type="button"
              className={!form.precisaDoc ? 'active' : ''}
              onClick={() => updateField('precisaDoc', false)}
            >
              Não
            </button>
          </div>
        </div>

        {/* Observações */}
        <label className="field field-full">
          <span className="field-label">Observações</span>
          <textarea
            placeholder="Informações complementares"
            value={form.observacoes}
            onChange={(e) => updateField('observacoes', e.target.value)}
          />
        </label>

      </div>

      <div className="form-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar Atendimento</Button>
      </div>
    </form>
  );
}
