import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const promptList = [
  {
    promptText: "Analyze why certain tech products fail despite having superior technology (e.g., Google Glass, Windows Phone, Quibi). What market factors matter more than technical excellence?",
    visibility: 50,
    sentiment: 60,
    position: 5,
    members:[]
  },
  {
    promptText: "OpenAI, Anthropic, Google, and Meta are all competing in the AI space. If you were launching a new AI company today with $50M funding, what niche or differentiation strategy would you pursue to avoid direct competition?",
    visibility: 50,
    sentiment: 60,
    position: 5,
    members:[]
  },
  {
    promptText: "Traditional SaaS uses subscription pricing. Design an alternative monetization model for B2B software (usage-based? outcome-based? revenue-share?) that could disrupt the current market and provide better alignment between vendor and customer.",
    visibility: 50,
    sentiment: 60,
    position: 5,
    members:[]
  },
];

export function PromptTable() {
  return (
    <Table>
      <TableCaption>Prompts</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Prompt</TableHead>
          <TableHead>Visibility</TableHead>
          <TableHead>Sentiments</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Mentions</TableHead>

        </TableRow>
      </TableHeader>
      <TableBody>
        {promptList.map((prompt) => (
          <TableRow key={prompt.position}>
             <TableCell className="font-medium max-w-[400px] whitespace-normal">{prompt.promptText}</TableCell>
            <TableCell className="font-medium">{prompt.visibility}</TableCell>
            <TableCell>{prompt.sentiment}</TableCell>
            <TableCell>{prompt.position}</TableCell>
            <TableCell className="text-right">{prompt.members}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      {/* <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">$2,500.00</TableCell>
        </TableRow>
      </TableFooter> */}
    </Table>
  )
}
