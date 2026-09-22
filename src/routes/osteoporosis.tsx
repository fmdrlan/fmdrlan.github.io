import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SiteNav } from '@/components/SiteNav'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DrugCompareTab } from '@/components/osteoporosis/DrugCompareTab'
import { IntakeTab } from '@/components/osteoporosis/IntakeTab'
import { PatientHandoutTab } from '@/components/osteoporosis/PatientHandoutTab'
import { ExerciseTab } from '@/components/osteoporosis/ExerciseTab'

export const Route = createFileRoute('/osteoporosis')({
  component: OsteoporosisPage,
})

type TabId = 'intake' | 'drugs' | 'patient' | 'exercise'

// @page has no Tailwind equivalent — this is the one deliberate exception to
// styling everything with Tailwind utilities, matching how the source page
// swapped print page size per tab.
const PAGE_RULE: Record<TabId, string> = {
  intake: '@page{size:A4 portrait;margin:12mm}',
  drugs: '@page{size:A3 landscape;margin:10mm}',
  patient: '@page{size:A4 portrait;margin:14mm 15mm}',
  exercise: '@page{size:A4 portrait;margin:6mm}',
}

function OsteoporosisPage() {
  const [tab, setTab] = useState<TabId>('intake')

  return (
    <>
      <style>{PAGE_RULE[tab]}</style>
      <div className="print:hidden">
        <SiteNav />
      </div>

      <div className="sticky top-0 z-40 border-b border-border bg-bg2 print:hidden">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)}>
          <TabsList variant="line" className="mx-auto w-full max-w-[1500px] justify-start border-b-0 px-6 max-md:px-4">
            <TabsTrigger value="intake" className="flex-none">問診</TabsTrigger>
            <TabsTrigger value="drugs" className="flex-none">藥物比較</TabsTrigger>
            <TabsTrigger value="patient" className="flex-none">病人用藥注意事項</TabsTrigger>
            <TabsTrigger value="exercise" className="flex-none">骨鬆運動</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {tab === 'intake' && <IntakeTab />}
      {tab === 'drugs' && <DrugCompareTab />}
      {tab === 'patient' && <PatientHandoutTab />}
      {tab === 'exercise' && <ExerciseTab />}
    </>
  )
}
