import { PromptTable } from '@/components/PromptTable'
import { VisibilityChart } from '@/components/VisibilityChart'
import React from 'react'

export default function Overview() {
  return (
    <div>
      
      <div className="flex felx-col">
        {/* chart */}
        <div className='h-100 w-150 pl-5 pt-5'>
          <VisibilityChart/>
        </div>
        {/* brand table */}
        <div>
          <PromptTable/>
        </div>
      </div>
    </div>
  )
}
