import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { isAuthenticated, user, impersonating } = useAuth();
  const [atendimentos, setAtendimentos] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [pacientes, setPacientes] = useState([]);

  // Carrega dados do profissional — direto ou via impersonação do admin
  useEffect(() => {
    if (!isAuthenticated) {
      setAtendimentos([]); setDespesas([]); setPacientes([]);
      return;
    }

    // Admin impersonando: o header X-Impersonate-Id já está ativo no api.js
    // As rotas normais (/atendimentos, /despesas, /pacientes) retornam os dados do profissional
    if (impersonating) {
      api.listarAtendimentos().then(setAtendimentos).catch(console.error);
      api.listarDespesas().then(setDespesas).catch(console.error);
      api.listarPacientes().then(setPacientes).catch(console.error);
      return;
    }

    // Admin sem impersonação: sem dados próprios
    if (user?.perfil === 'admin') {
      setAtendimentos([]); setDespesas([]); setPacientes([]);
      return;
    }

    // Profissional normal
    api.listarAtendimentos().then(setAtendimentos).catch(console.error);
    api.listarDespesas().then(setDespesas).catch(console.error);
    api.listarPacientes().then(setPacientes).catch(console.error);
  }, [isAuthenticated, user?.id, impersonating?.id]);

  /* ── Atendimentos ── */
  async function addAtendimento(item) {
    const tempId = Date.now();
    setAtendimentos((prev) => [{ ...item, id: tempId }, ...prev]);
    try {
      const novo = await api.criarAtendimento(item);
      setAtendimentos((prev) => prev.map((a) => (a.id === tempId ? novo : a)));
    } catch (err) {
      console.error('Erro ao criar atendimento:', err);
      setAtendimentos((prev) => prev.filter((a) => a.id !== tempId));
    }
  }

  async function updateAtendimento(id, item) {
    setAtendimentos((prev) => prev.map((a) => (a.id === id ? { ...a, ...item } : a)));
    try {
      const atualizado = await api.atualizarAtendimento(id, item);
      setAtendimentos((prev) => prev.map((a) => (a.id === id ? atualizado : a)));
    } catch (err) {
      console.error('Erro ao atualizar atendimento:', err);
    }
  }

  async function deleteAtendimento(id) {
    setAtendimentos((prev) => prev.filter((a) => a.id !== id));
    try {
      await api.excluirAtendimento(id);
    } catch (err) {
      console.error('Erro ao excluir atendimento:', err);
      api.listarAtendimentos().then(setAtendimentos).catch(console.error);
    }
  }

  /* ── Despesas ── */
  async function addDespesa(item) {
    const tempId = Date.now();
    setDespesas((prev) => [{ ...item, id: tempId }, ...prev]);
    try {
      const nova = await api.criarDespesa(item);
      setDespesas((prev) => prev.map((d) => (d.id === tempId ? nova : d)));
    } catch (err) {
      console.error('Erro ao criar despesa:', err);
      setDespesas((prev) => prev.filter((d) => d.id !== tempId));
    }
  }

  async function updateDespesa(id, item) {
    setDespesas((prev) => prev.map((d) => (d.id === id ? { ...d, ...item } : d)));
    try {
      const atualizada = await api.atualizarDespesa(id, item);
      setDespesas((prev) => prev.map((d) => (d.id === id ? atualizada : d)));
    } catch (err) {
      console.error('Erro ao atualizar despesa:', err);
    }
  }

  async function deleteDespesa(id) {
    setDespesas((prev) => prev.filter((d) => d.id !== id));
    try {
      await api.excluirDespesa(id);
    } catch (err) {
      console.error('Erro ao excluir despesa:', err);
      api.listarDespesas().then(setDespesas).catch(console.error);
    }
  }

  /* ── Pacientes ── */
  async function addPaciente(item) {
    const tempId = Date.now();
    setPacientes((prev) => [{ ...item, id: tempId }, ...prev]);
    try {
      const novo = await api.criarPaciente(item);
      setPacientes((prev) => prev.map((p) => (p.id === tempId ? novo : p)));
    } catch (err) {
      console.error('Erro ao criar paciente:', err);
      setPacientes((prev) => prev.filter((p) => p.id !== tempId));
    }
  }

  async function updatePaciente(id, item) {
    setPacientes((prev) => prev.map((p) => (p.id === id ? { ...p, ...item } : p)));
    try {
      const atualizado = await api.atualizarPaciente(id, item);
      setPacientes((prev) => prev.map((p) => (p.id === id ? atualizado : p)));
    } catch (err) {
      console.error('Erro ao atualizar paciente:', err);
    }
  }

  async function deletePaciente(id) {
    setPacientes((prev) => prev.filter((p) => p.id !== id));
    try {
      await api.excluirPaciente(id);
    } catch (err) {
      console.error('Erro ao excluir paciente:', err);
      api.listarPacientes().then(setPacientes).catch(console.error);
    }
  }

  return (
    <DataContext.Provider
      value={{
        atendimentos,
        addAtendimento,
        updateAtendimento,
        deleteAtendimento,
        despesas,
        addDespesa,
        updateDespesa,
        deleteDespesa,
        pacientes,
        addPaciente,
        updatePaciente,
        deletePaciente,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
