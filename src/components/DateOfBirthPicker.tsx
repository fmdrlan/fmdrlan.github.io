import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

function parseISO(value: string): Date | undefined {
  if (!value) return undefined
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplay(date: Date): string {
  return `${date.getFullYear()} / ${String(date.getMonth() + 1).padStart(2, '0')} / ${String(
    date.getDate()
  ).padStart(2, '0')}`
}

// Parse free typing like "1990/05/12", "1990-5-1", "1990 / 05 / 12" without tz drift.
function parseTyped(s: string): Date | undefined {
  const m = s.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/)
  if (!m) return undefined
  const [, y, mo, d] = m.map(Number)
  const date = new Date(y, mo - 1, d)
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== mo - 1 ||
    date.getDate() !== d
  )
    return undefined
  return date
}

export function DateOfBirthPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (iso: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = parseISO(value)
  const today = new Date()
  const [text, setText] = useState(selected ? formatDisplay(selected) : '')
  const [month, setMonth] = useState<Date | undefined>(selected ?? today)

  return (
    <div className="relative w-[190px]">
      <Input
        value={text}
        placeholder="yyyy / mm / dd"
        onChange={(e) => {
          const v = e.target.value
          setText(v)
          if (v.trim() === '') {
            onChange('')
            return
          }
          const d = parseTyped(v)
          if (d && d <= today) {
            setMonth(d)
            onChange(toISO(d))
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setOpen(true)
          }
        }}
        className="!rounded-lg !border-border !bg-surface !py-2 !pr-9 !pl-3.5 !text-[15px] !text-text focus-visible:!border-accent focus-visible:!ring-accent/15"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              aria-label="開啟月曆"
              className="!absolute !right-1 !top-1/2 !h-7 !w-7 !-translate-y-1/2 !p-0 text-text-muted hover:!bg-accent-dim hover:text-accent"
            />
          }
        >
          <CalendarDays className="h-4 w-4" strokeWidth={1.8} />
        </PopoverTrigger>
        <PopoverContent className="!w-auto !p-0" align="end" alignOffset={-4} sideOffset={8}>
          <Calendar
            mode="single"
            selected={selected}
            month={month}
            onMonthChange={setMonth}
            captionLayout="dropdown"
            startMonth={new Date(1920, 0)}
            endMonth={today}
            disabled={{ after: today }}
            onSelect={(d) => {
              if (d) {
                onChange(toISO(d))
                setText(formatDisplay(d))
                setMonth(d)
                setOpen(false)
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
