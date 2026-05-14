import { CalendarDays, CircleDollarSign, FileText, IdCard, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Button from './Button.jsx';
import Input from './Input.jsx';

const initialState = {
  dataAtendimento: '',
  valorRecebido: '',
  pagadorNome: '',
  pagadorDoc: '',
  pacienteMesmoPagador: true,
  pacienteNome: '',
  pacienteCpf: '',
  precisaDoc: true,
  observacoes: ''
};

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function parseBrazilianCurrency(value) {
  const normalized = String(value || '').replace(/\./g, '').replace(',', '.');
  return Number(normalized);
}

function getCompetencia(date) {
  if (!date) return '';
  const [year, month] = date.split('-');
  return `${month}/${year}`;
}

export default function AtendimentoForm({ initialValues, onCancel, onSubmit }) {
  const [form, setForm] = useState({ ...initialState, ...initialValues });
  const [errors, setErrors] = useState({});

  const competencia = useMemo(() => getCompetencia(form.dataAtendimento), [form.dataAtendimento]);

  useEffect(() => {
    if (!form.pacienteMesmoPagador) return;

    setForm((current) => ({
      ...current,
      pacienteNome: current.pagadorNome,
      pacienteCpf: onlyDigits(current.pagadorDoc)
    }));
  }, [form.pacienteMesmoPagador, form.pagadorNome, form.pagadorDoc]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function validate() {
    const nextErrors = {};
    const valor = parseBrazilianCurrency(form.valorRecebido);
    const pagadorDoc = onlyDigits(form.pagadorDoc);
    const pacienteCpf = onlyDigits(form.pacienteCpf);

    if (!form.dataAtendimento) nextErrors.dataAtendimento = 'Informe a data.';
    if (!valor || valor <= 0) nextErrors.valorRecebido = 'Informe um valor maior que zero.';
    if (!form.pagadorNome.trim()) nextErrors.pagadorNome = 'Informe o pagador.';
    if (![11, 14].includes(pagadorDoc.length)) {
      nextErrors.pagadorDoc = 'CPF/CNPJ deve ter 11 ou 14 dígitos.';
    }
    if (!form.pacienteNome.trim()) nextErrors.pacienteNome = 'Informe o paciente.';
    if (pacienteCpf.length !== 11) nextErrors.pacienteCpf = 'CPF deve ter 11 dígitos.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      ...form,
      competencia,
      valor: parseBrazilianCurrency(form.valorRecebido),
      pagadorDoc: onlyDigits(form.pagadorDoc),
      pacienteCpf: onlyDigits(form.pacienteCpf)
    };

    // TODO: integrar com API real
    // TODO: salvar no PostgreSQL
    onSubmit?.(payload);
  }

  return (
    <form className="attendance-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <Input
          label="Data do atendimento"
          type="date"
          icon={CalendarDays}
          value={form.dataAtendimento}
          error={errors.dataAtendimento}
          onChange={(event) => updateField('dataAtendimento', event.target.value)}
        />
        <Input
          label="Valor recebido"
          icon={CircleDollarSign}
          inputMode="decimal"
          placeholder="150,00"
          value={form.valorRecebido}
          error={errors.valorRecebido}
          onChange={(event) => updateField('valorRecebido', event.target.value)}
        />
        <Input
          label="Competência"
          icon={FileText}
          value={competencia}
          readOnly
          placeholder="Automática"
        />
        <Input
          label="Nome do pagador"
          icon={User}
          placeholder="Nome completo"
          value={form.pagadorNome}
          error={errors.pagadorNome}
          onChange={(event) => updateField('pagadorNome', event.target.value)}
        />
        <Input
          label="CPF/CNPJ do pagador"
          icon={IdCard}
          inputMode="numeric"
          placeholder="Somente números"
          value={form.pagadorDoc}
          error={errors.pagadorDoc}
          onChange={(event) => updateField('pagadorDoc', event.target.value)}
        />
        <label className="check-card">
          <input
            type="checkbox"
            checked={form.pacienteMesmoPagador}
            onChange={(event) => updateField('pacienteMesmoPagador', event.target.checked)}
          />
          <span>Paciente é o mesmo do pagador</span>
        </label>
        <Input
          label="Nome do paciente"
          icon={User}
          placeholder="Nome completo"
          value={form.pacienteNome}
          error={errors.pacienteNome}
          readOnly={form.pacienteMesmoPagador}
          onChange={(event) => updateField('pacienteNome', event.target.value)}
        />
        <Input
          label="CPF do paciente"
          icon={IdCard}
          inputMode="numeric"
          placeholder="Somente números"
          value={form.pacienteCpf}
          error={errors.pacienteCpf}
          readOnly={form.pacienteMesmoPagador}
          onChange={(event) => updateField('pacienteCpf', event.target.value)}
        />
        <div className="field">
          <span className="field-label">Paciente precisa de NF ou recibo?</span>
          <div className="segmented-control" role="group" aria-label="Paciente precisa de NF ou recibo">
            <button
              className={form.precisaDoc ? 'active' : ''}
              type="button"
              onClick={() => updateField('precisaDoc', true)}
            >
              Sim
            </button>
            <button
              className={!form.precisaDoc ? 'active' : ''}
              type="button"
              onClick={() => updateField('precisaDoc', false)}
            >
              Não
            </button>
          </div>
        </div>
        <label className="field field-full">
          <span className="field-label">Observações</span>
          <textarea
            placeholder="Informações complementares"
            value={form.observacoes}
            onChange={(event) => updateField('observacoes', event.target.value)}
          />
        </label>
      </div>

      <div className="form-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Salvar Atendimento
        </Button>
      </div>
    </form>
  );
}
