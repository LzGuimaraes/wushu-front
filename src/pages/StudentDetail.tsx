import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import {
  createBeltHistory,
  createGuardian,
  deleteBeltHistory,
  deleteGuardian,
  getMedicalRecord,
  getStudent,
  listBeltHistory,
  listGuardians,
  upsertMedicalRecord,
} from '../api'
import type {
  BeltHistory,
  Guardian,
  MedicalRecord,
  StudentProfile,
} from '../types'

const goalLabels: Record<string, string> = {
  FITNESS: 'Fitness',
  COMPETITION: 'Competição',
  SELF_DEFENSE: 'Defesa pessoal',
  LEISURE: 'Lazer',
  OTHER: 'Outro',
}

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [medical, setMedical] = useState<MedicalRecord | null>(null)
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [belts, setBelts] = useState<BeltHistory[]>([])
  const [message, setMessage] = useState('')

  const [medicalForm, setMedicalForm] = useState<Record<string, string>>({})
  const [guardianForm, setGuardianForm] = useState<Record<string, string>>({})
  const [beltForm, setBeltForm] = useState<Record<string, string>>({})

  const load = () => {
    if (!id) return
    getStudent(id).then((r) => setProfile(r.data)).catch(() => setProfile(null))
    getMedicalRecord(id)
      .then((r) => setMedical(r.data))
      .catch(() => setMedical(null))
    listGuardians(id).then((r) => setGuardians(r.data)).catch(() => setGuardians([]))
    listBeltHistory(id).then((r) => setBelts(r.data)).catch(() => setBelts([]))
  }

  useEffect(load, [id])

  const setMedicalField =
    (key: string) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setMedicalForm((f) => ({ ...f, [key]: e.target.value }))

  const setGuardianField =
    (key: string) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setGuardianForm((f) => ({ ...f, [key]: e.target.value }))

  const setBeltField =
    (key: string) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setBeltForm((f) => ({ ...f, [key]: e.target.value }))

  const saveMedical = async (e: FormEvent) => {
    e.preventDefault()
    if (!id) return
    const payload: Record<string, unknown> = {}
    const boolFields = [
      'hasDisease',
      'usesMedication',
      'hasPhysicalLimitation',
      'hasAllergy',
      'hasPreviousInjury',
    ] as const
    for (const f of boolFields) {
      payload[f] = medicalForm[f] === 'true'
    }
    const textFields = [
      'diseaseDescription',
      'medicationDescription',
      'physicalLimitationDescription',
      'allergyDescription',
      'previousInjuryDescription',
    ] as const
    for (const f of textFields) {
      if (medicalForm[f]) payload[f] = medicalForm[f]
    }
    try {
      await upsertMedicalRecord(id, payload)
      setMessage('Ficha médica salva')
      load()
    } catch {
      setMessage('Erro ao salvar ficha médica')
    }
  }

  const addGuardian = async (e: FormEvent) => {
    e.preventDefault()
    if (!id) return
    try {
      await createGuardian({
        studentProfileId: id,
        name: guardianForm.name,
        cpf: guardianForm.cpf,
        phone: guardianForm.phone,
      })
      setGuardianForm({})
      load()
    } catch {
      setMessage('Erro ao adicionar responsável')
    }
  }

  const addBelt = async (e: FormEvent) => {
    e.preventDefault()
    if (!id) return
    const payload: Record<string, unknown> = {
      studentProfileId: id,
      belt: beltForm.belt,
    }
    if (beltForm.graduationDate) payload.graduationDate = beltForm.graduationDate
    if (beltForm.notes) payload.notes = beltForm.notes
    try {
      await createBeltHistory(payload)
      setBeltForm({})
      load()
    } catch {
      setMessage('Erro ao registrar faixa')
    }
  }

  const removeGuardian = async (guardianId: string) => {
    await deleteGuardian(guardianId)
    load()
  }

  const removeBelt = async (beltId: string) => {
    await deleteBeltHistory(beltId)
    load()
  }

  if (!profile) {
    return <p className="muted">Carregando aluno...</p>
  }

  return (
    <div>
      <h1>Ficha do aluno</h1>
      {message && <p className="success">{message}</p>}

      <div className="card">
        <h2>Dados pessoais</h2>
        <p>
          <strong>CPF:</strong> {profile.cpf} · <strong>Cidade:</strong> {profile.city}
        </p>
        <p>
          <strong>Telefone:</strong> {profile.phone} · <strong>Faixa:</strong>{' '}
          {profile.belt ?? '-'}
        </p>
        <p>
          <strong>Modalidade:</strong> {profile.trainingModality} ·{' '}
          <strong>Objetivo:</strong> {goalLabels[profile.goal] ?? profile.goal}
        </p>
        <p>
          <strong>Endereço:</strong> {profile.address}, {profile.district}, {profile.zipCode}
        </p>
      </div>

      <div className="card">
        <h2>Ficha médica</h2>
        <form onSubmit={saveMedical}>
          <div className="grid-2">
            {(
              [
                ['hasDisease', 'Possui doença?'],
                ['usesMedication', 'Usa medicação?'],
                ['hasPhysicalLimitation', 'Limitação física?'],
                ['hasAllergy', 'Alergias?'],
                ['hasPreviousInjury', 'Lesão anterior?'],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <select
                  value={medicalForm[key] ?? (medical?.[key] ? 'true' : 'false')}
                  onChange={setMedicalField(key)}
                >
                  <option value="false">Não</option>
                  <option value="true">Sim</option>
                </select>
              </label>
            ))}
            {(
              [
                ['diseaseDescription', 'Descrição da doença'],
                ['medicationDescription', 'Medicações'],
                ['physicalLimitationDescription', 'Limitações'],
                ['allergyDescription', 'Alergias'],
                ['previousInjuryDescription', 'Lesões anteriores'],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <textarea
                  value={medicalForm[key] ?? medical?.[key] ?? ''}
                  onChange={setMedicalField(key)}
                />
              </label>
            ))}
          </div>
          <div className="form-actions">
            <button className="btn-primary" type="submit">
              Salvar ficha
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Responsáveis</h2>
        <form onSubmit={addGuardian} className="grid-2">
          <label>
            Nome
            <input value={guardianForm.name ?? ''} onChange={setGuardianField('name')} required />
          </label>
          <label>
            CPF
            <input value={guardianForm.cpf ?? ''} onChange={setGuardianField('cpf')} required />
          </label>
          <label>
            Telefone
            <input value={guardianForm.phone ?? ''} onChange={setGuardianField('phone')} required />
          </label>
          <div className="form-actions">
            <button className="btn-primary" type="submit">
              Adicionar
            </button>
          </div>
        </form>
        <ul>
          {guardians.map((g) => (
            <li key={g.id}>
              {g.name} · {g.cpf} · {g.phone}{' '}
              <button className="btn-danger btn-sm" onClick={() => removeGuardian(g.id)}>
                Remover
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Histórico de faixas</h2>
        <form onSubmit={addBelt} className="grid-2">
          <label>
            Faixa
            <input value={beltForm.belt ?? ''} onChange={setBeltField('belt')} required />
          </label>
          <label>
            Data de graduação
            <input
              type="date"
              value={beltForm.graduationDate ?? ''}
              onChange={setBeltField('graduationDate')}
            />
          </label>
          <label>
            Observações
            <input value={beltForm.notes ?? ''} onChange={setBeltField('notes')} />
          </label>
          <div className="form-actions">
            <button className="btn-primary" type="submit">
              Registrar
            </button>
          </div>
        </form>
        <ul>
          {belts.map((b) => (
            <li key={b.id}>
              {b.belt} {b.graduationDate ? `· ${b.graduationDate.slice(0, 10)}` : ''}{' '}
              <button className="btn-danger btn-sm" onClick={() => removeBelt(b.id)}>
                Remover
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
