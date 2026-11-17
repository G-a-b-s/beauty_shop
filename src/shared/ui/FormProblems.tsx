export function FormProblems({ problems }: { problems: string[] }) {
  return (
    <div role="status" className="text-sm text-amber-700">
      <p>Para salvar:</p>
      <ul className="mt-1 list-disc pl-5">
        {problems.map((problem) => (
          <li key={problem}>{problem}</li>
        ))}
      </ul>
    </div>
  )
}
