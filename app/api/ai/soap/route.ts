import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  throw new Error('Missing GEMINI_API_KEY in environment variables')
}

const genAI = new GoogleGenerativeAI(apiKey)

const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.1,
    maxOutputTokens: 500,
  },
})

function parseSections(text: string) {
  const lines = text
    .replace(/```/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const sections: Record<'ASSESSMENT' | 'PLAN' | 'OBJECTIVE', string> = {
    ASSESSMENT: '',
    PLAN: '',
    OBJECTIVE: '',
  }

  let current: 'ASSESSMENT' | 'PLAN' | 'OBJECTIVE' | null = null

  for (const line of lines) {
    if (line.startsWith('ASSESSMENT:')) {
      current = 'ASSESSMENT'
      sections.ASSESSMENT = line.replace('ASSESSMENT:', '').trim()
      continue
    }

    if (line.startsWith('PLAN:')) {
      current = 'PLAN'
      sections.PLAN = line.replace('PLAN:', '').trim()
      continue
    }

    if (line.startsWith('OBJECTIVE:')) {
      current = 'OBJECTIVE'
      sections.OBJECTIVE = line.replace('OBJECTIVE:', '').trim()
      continue
    }

    if (current) {
      sections[current] = sections[current]
        ? `${sections[current]} ${line}`
        : line
    }
  }

  return sections
}

export async function POST(req: NextRequest) {
  try {
    const {
      chiefComplaint,
      subjective,
      objective,
      species,
      breed,
      visitType,
      vitals,
    } = await req.json()

    const vitalsText = Object.entries(vitals || {})
      .filter(([, value]) => value)
      .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
      .join(', ')

    const prompt = `
You are a veterinary SOAP note assistant.

Return exactly 3 sections in this exact order and format:

ASSESSMENT:
one short paragraph

PLAN:
one short paragraph

OBJECTIVE:
one short paragraph

Rules:
- Use the exact labels ASSESSMENT, PLAN, OBJECTIVE
- Put each label on its own line
- Put the content for that label on the next line
- Leave one blank line between sections
- Do not use bullets
- Do not use markdown
- Do not add extra text
- Keep each section under 180 characters
- Do not repeat the diagnosis in every section

Case:
Species: ${species || 'unknown'}
Breed: ${breed || 'unknown'}
Visit type: ${visitType || 'consultation'}
Chief complaint: ${chiefComplaint || 'Not provided'}
Subjective: ${subjective || 'Not provided'}
Objective: ${objective || 'Not provided'}
Vitals: ${vitalsText || 'Not provided'}
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    console.log('GEMINI RAW RESPONSE:', text)

    const parsed = parseSections(text)

    return NextResponse.json({
      assessment: parsed.ASSESSMENT ?? '',
      plan: parsed.PLAN ?? '',
      objective: parsed.OBJECTIVE ?? '',
    })
  } catch (error: any) {
    console.error('GEMINI SOAP ERROR:', error)
    return NextResponse.json(
      {
        error: error?.message || error?.toString() || 'Gemini request failed',
      },
      { status: 500 }
    )
  }
}