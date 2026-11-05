'use client'

/** Lists show Yes or No, instead of the raw true and false. */
export const YesNo = ({ cellData }: { cellData?: unknown }) => <span>{cellData ? 'Yes' : 'No'}</span>
