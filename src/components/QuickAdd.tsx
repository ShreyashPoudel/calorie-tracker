import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { Food, FoodUnit, MealType } from '../types/nutrition'
import { MEAL_EMOJI, MEAL_LABELS, MEAL_TYPES } from '../types/nutrition'
import { FOODS } from '../data/foods'
import { formatNumber } from '../utils/calculations'
import { parseFoodInput } from '../utils/parser'
import type { ParsedFood } from '../utils/parser'

interface QuickAddProps {
  date: string
  /** Names of any foods the user has logged previously — used as a fallback when
   *  parsing input that doesn't match the built-in DB. */
  knownNames: string[]
  /** Defaults to today's wall-clock hour: breakfast before 11am, lunch until 4pm, snacks till 7, dinner after. */
  defaultMeal?: MealType
  onAdd: (date: string, food: Omit<Food, 'id'>) => void
  onClose: () => void
}

/** Default the meal selector to whatever part of the day it is right now. */
function guessMeal(): MealType {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 16) return 'lunch'
  if (h < 19) return 'snacks'
  return 'dinner'
}

// Web Speech API isn't in the TS lib by default; these are the runtime types
// every browser that supports it exposes. `webkitSpeechRecognition` is the
// Safari/older-Chrome prefix.
type SpeechRecognitionEventLike = {
  results: ArrayLike<{
    0: { transcript: string; confidence: number }
    isFinal: boolean
  }>
}
type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null
  onerror: ((ev: { error: string }) => void) | null
  onend: (() => void) | null
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

interface EditableItem extends ParsedFood {
  /** Track edits the user makes to the parsed quantity/grams in the modal. */
  editGrams: number
  editQuantity: number
  editUnit: FoodUnit
  editPieceUnit?: string
}

/**
 * Quick-add modal: type or speak a sentence like "two eggs and a banana",
 * see it parsed into structured rows, then commit them all to one meal in
 * one tap. Falls back gracefully to plain text parsing if the browser
 * doesn't support speech recognition.
 */
export function QuickAdd({
  date,
  knownNames,
  defaultMeal,
  onAdd,
  onClose,
}: QuickAddProps) {
  const headingId = useId()
  const [text, setText] = useState('')
  const [meal, setMeal] = useState<MealType>(defaultMeal ?? guessMeal())
  const [editable, setEditable] = useState<EditableItem[]>([])
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const recRef = useRef<SpeechRecognitionLike | null>(null)
  const textRef = useRef(text)
  textRef.current = text

  // Build the combined food list: built-in DB + any foods the user has
  // previously logged. Custom foods keep their name but use whatever macros
  // we saw last time (we don't have a per-custom-food DB yet, so this is a
  // light-weight fallback for matching).
  const allFoods = useMemo(() => {
    const result = [...FOODS]
    for (const name of knownNames) {
      const lower = name.toLowerCase()
      if (!result.some((f) => f.name.toLowerCase() === lower)) {
        // No macros known yet — just add a placeholder so the name can be
        // detected. Totals will show 0, prompting the user to edit.
        result.push({ name, calories: 0, protein: 0 })
      }
    }
    return result
  }, [knownNames])

  // Reparse the text every time it changes.
  useEffect(() => {
    const parsed = parseFoodInput(text, allFoods)
    setEditable(
      parsed.map((p) => ({
        ...p,
        editGrams:
          p.unit === 'piece' && p.food?.pieceWeight
            ? p.food.pieceWeight * p.quantity
            : p.quantity,
        editQuantity: p.quantity,
        editUnit: p.unit,
        editPieceUnit: p.pieceUnit,
      })),
    )
  }, [text, allFoods])

  // Stop any in-flight recognition when the modal closes.
  useEffect(() => {
    return () => {
      recRef.current?.abort()
    }
  }, [])

  function startListening() {
    setVoiceError(null)
    setInterim('')
    const SR = getSpeechRecognition()
    if (!SR) {
      setVoiceError(
        "Voice input isn't supported in this browser. Try Chrome or Edge, or just type below.",
      )
      return
    }
    const rec = new SR()
    rec.lang = 'en-US'
    rec.continuous = false
    rec.interimResults = true
    recRef.current = rec

    rec.onresult = (ev) => {
      let finalText = ''
      let interimText = ''
      for (const r of Array.from(ev.results)) {
        if (r.isFinal) {
          finalText += r[0].transcript
        } else {
          interimText += r[0].transcript
        }
      }
      if (finalText) {
        setText((prev) => {
          const sep = prev && !prev.endsWith(' ') ? ' ' : ''
          return (prev + sep + finalText).trim()
        })
        setInterim('')
      } else {
        setInterim(interimText)
      }
    }
    rec.onerror = (ev) => {
      setVoiceError(`Mic error: ${ev.error}`)
      setListening(false)
    }
    rec.onend = () => {
      setListening(false)
      setInterim('')
    }

    try {
      rec.start()
      setListening(true)
    } catch (e) {
      setVoiceError(
        e instanceof Error ? e.message : 'Could not start microphone',
      )
      setListening(false)
    }
  }

  function stopListening() {
    recRef.current?.stop()
    setListening(false)
  }

  function updateGrams(idx: number, newGrams: number) {
    setEditable((prev) =>
      prev.map((it, i) =>
        i === idx
          ? {
              ...it,
              editGrams: newGrams,
              editQuantity: newGrams,
              editUnit: 'g',
              editPieceUnit: undefined,
            }
          : it,
      ),
    )
  }

  function updateQuantity(idx: number, newQty: number) {
    setEditable((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it
        const pieceWeight = it.food?.pieceWeight ?? 0
        const grams =
          it.editUnit === 'piece' && pieceWeight
            ? pieceWeight * newQty
            : newQty
        const calories = it.food
          ? Math.round((it.food.calories * grams) / 100)
          : 0
        const protein = it.food
          ? Math.round((it.food.protein * grams) / 100 * 10) / 10
          : 0
        return {
          ...it,
          editQuantity: newQty,
          editGrams: grams,
          calories,
          protein,
        }
      }),
    )
  }

  function toggleUnit(idx: number) {
    setEditable((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it
        const nextUnit: FoodUnit = it.editUnit === 'g' ? 'piece' : 'g'
        const pieceWeight = it.food?.pieceWeight ?? 0
        let grams = it.editGrams
        let quantity = it.editQuantity
        if (nextUnit === 'piece' && pieceWeight) {
          quantity = Math.max(1, Math.round(grams / pieceWeight))
          grams = pieceWeight * quantity
        } else {
          grams = quantity * (pieceWeight || 1)
        }
        const calories = it.food
          ? Math.round((it.food.calories * grams) / 100)
          : 0
        const protein = it.food
          ? Math.round((it.food.protein * grams) / 100 * 10) / 10
          : 0
        return {
          ...it,
          editUnit: nextUnit,
          editPieceUnit: nextUnit === 'piece' ? it.food?.pieceUnit : undefined,
          editQuantity: quantity,
          editGrams: grams,
          calories,
          protein,
        }
      }),
    )
  }

  function removeRow(idx: number) {
    setEditable((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleAdd() {
    const recognized = editable.filter((it) => it.food !== null)
    if (recognized.length === 0) return
    setSubmitting(true)
    try {
      for (const it of recognized) {
        onAdd(date, {
          name: it.food!.name,
          meal,
          quantity: it.editQuantity,
          grams: Math.round(it.editGrams),
          unit: it.editUnit,
          pieceUnit: it.editPieceUnit,
          calories: it.calories,
          protein: it.protein,
        })
      }
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const totalCal = editable.reduce((s, it) => s + it.calories, 0)
  const totalPro = editable.reduce((s, it) => s + it.protein, 0)
  const recognizedCount = editable.filter((it) => it.food !== null).length
  const canAdd = recognizedCount > 0 && !submitting

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-3 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="card w-full max-w-lg p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 id={headingId} className="text-lg font-semibold">
            ✨ Quick add
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost px-2 py-1 text-base"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="mb-3 text-xs text-slate-500">
          Type or speak a sentence like{' '}
          <em className="not-italic font-medium text-slate-700">
            "two eggs and 100g chicken"
          </em>
          . We'll parse it for you.
        </p>

        <div className="relative">
          <textarea
            className="input min-h-[72px] resize-y pr-12"
            placeholder="What did you eat?"
            value={text + (interim ? (text ? ' ' : '') + interim : '')}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleAdd()
              }
            }}
          />
          <button
            type="button"
            onClick={listening ? stopListening : startListening}
            className={
              listening
                ? 'absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-sm text-white shadow ring-4 ring-red-100'
                : 'absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm text-slate-600 hover:bg-slate-200'
            }
            title={
              listening
                ? 'Stop listening'
                : "Click to speak (you'll need to allow microphone access)"
            }
            aria-label={listening ? 'Stop listening' : 'Start listening'}
          >
            {listening ? '■' : '🎙'}
          </button>
        </div>

        {listening && (
          <p className="mt-1.5 text-xs text-red-600">
            Listening{interim ? `… "${interim}"` : '…'}
          </p>
        )}
        {voiceError && (
          <p className="mt-1.5 text-xs text-amber-700">{voiceError}</p>
        )}

        <div className="mt-3">
          <label className="label" htmlFor="quick-meal">
            Add to meal
          </label>
          <div
            id="quick-meal"
            className="flex flex-wrap gap-1.5"
            role="radiogroup"
          >
            {MEAL_TYPES.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={meal === m}
                onClick={() => setMeal(m)}
                className={
                  meal === m
                    ? 'rounded-full bg-brand-600 px-3 py-1.5 text-xs font-medium text-white'
                    : 'rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50'
                }
              >
                <span className="mr-1" aria-hidden>
                  {MEAL_EMOJI[m]}
                </span>
                {MEAL_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        {editable.length > 0 ? (
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                Parsed ({recognizedCount}/{editable.length} recognized)
              </span>
              <span className="text-slate-500">
                {formatNumber(totalCal)} kcal · {formatNumber(totalPro)} g protein
              </span>
            </div>
            <ul className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/60 p-2">
              {editable.map((it, idx) => (
                <ParsedRow
                  key={`${it.rawText}-${idx}`}
                  item={it}
                  onGramsChange={(g) => updateGrams(idx, g)}
                  onQuantityChange={(q) => updateQuantity(idx, q)}
                  onToggleUnit={() => toggleUnit(idx)}
                  onRemove={() => removeRow(idx)}
                />
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-3 rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
            Items you type will appear here.
          </p>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleAdd}
            disabled={!canAdd}
            title={
              !canAdd
                ? 'Type something we recognize first'
                : `Add ${recognizedCount} item${recognizedCount === 1 ? '' : 's'} to ${MEAL_LABELS[meal]}`
            }
          >
            Add {recognizedCount || ''} item
            {recognizedCount === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ParsedRow({
  item,
  onGramsChange,
  onQuantityChange,
  onToggleUnit,
  onRemove,
}: {
  item: EditableItem
  onGramsChange: (g: number) => void
  onQuantityChange: (q: number) => void
  onToggleUnit: () => void
  onRemove: () => void
}) {
  const matched = item.food !== null
  return (
    <li
      className={
        matched
          ? 'flex items-center gap-2 rounded-md bg-white px-2.5 py-1.5 shadow-sm'
          : 'flex items-center gap-2 rounded-md bg-amber-50 px-2.5 py-1.5 ring-1 ring-amber-200'
      }
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={
              matched
                ? 'truncate text-sm font-medium text-slate-800'
                : 'truncate text-sm font-medium text-amber-800'
            }
            title={matched ? item.food!.name : `Unknown: ${item.name}`}
          >
            {matched ? item.food!.name : item.name}
          </span>
          {!matched && (
            <span className="text-[10px] font-medium uppercase tracking-wide text-amber-700">
              ?
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-500">
          <span className="font-mono">{formatNumber(item.calories)} kcal</span>{' '}
          ·{' '}
          <span className="font-mono">{formatNumber(item.protein)} g P</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {item.editUnit === 'g' ? (
          <input
            type="number"
            min="0"
            step="1"
            value={Math.round(item.editGrams)}
            onChange={(e) => onGramsChange(Number(e.target.value))}
            className="w-16 rounded-md border border-slate-200 px-2 py-1 text-right text-xs"
            aria-label="grams"
          />
        ) : (
          <input
            type="number"
            min="0"
            step="1"
            value={item.editQuantity}
            onChange={(e) => onQuantityChange(Number(e.target.value))}
            className="w-16 rounded-md border border-slate-200 px-2 py-1 text-right text-xs"
            aria-label="quantity"
          />
        )}
        <button
          type="button"
          onClick={onToggleUnit}
          disabled={!matched || !item.food?.pieceWeight}
          className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          title={
            !matched
              ? 'Pick a known food first'
              : !item.food?.pieceWeight
                ? 'No per-piece data for this food'
                : `Switch to ${item.editUnit === 'g' ? 'piece' : 'grams'}`
          }
        >
          {item.editUnit === 'g' ? 'g' : item.food?.pieceUnit ?? 'pc'}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md px-1.5 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-red-600"
          aria-label="Remove this row"
          title="Remove"
        >
          ✕
        </button>
      </div>
    </li>
  )
}