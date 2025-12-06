// components/elenco/sections/PlannerSection.tsx
import React from 'react'
import { PlannerSectionProps } from '../types'
import { DragAndDropPlanner } from './DragAndDropPlanner'

export const PlannerSection: React.FC<PlannerSectionProps> = (props) => {
  return <DragAndDropPlanner {...props} />
}