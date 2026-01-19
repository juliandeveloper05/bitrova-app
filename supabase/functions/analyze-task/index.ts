/**
 * Supabase Edge Function: analyze-task
 * TaskList App - Phase 4 Monetization
 * 
 * AI-powered task analysis using OpenAI gpt-4o-mini
 * 
 * Deploy: supabase functions deploy analyze-task
 * Set secret: supabase secrets set OPENAI_API_KEY=sk-...
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import OpenAI from 'npm:openai'

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS for React Native
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { task_content, current_date } = await req.json()

    if (!task_content) {
      throw new Error('Task content is required')
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cost-effective model
      messages: [
        {
          role: "system",
          content: `You are an AI assistant for a task management app called Bitrova. 
          Analyze the user's task description and extract structured data.
          
          Return JSON ONLY. No markdown. Format:
          {
            "priority": "High" | "Medium" | "Low",
            "suggested_due_date": "YYYY-MM-DD" or null (if no time context implied),
            "reasoning": "Short explanation (max 10 words)",
            "confidence": 0.0-1.0
          }
          
          Context: Current date is ${current_date}.
          Rules:
          1. Urgent words (ASAP, now, emergency) -> High.
          2. Vague future (sometime, later) -> Low.
          3. If specific day mentioned (e.g. "next Friday"), calculate date based on current date.
          4. Work/business tasks often need higher priority.
          5. Personal errands without deadline -> Low-Medium.
          `
        },
        {
          role: "user",
          content: `New Task: "${task_content}"`
        }
      ],
      temperature: 0.3, // Low temperature for consistent formatting
      max_tokens: 150,
    })

    const aiResponse = completion.choices[0].message.content
    
    // Parse the JSON string from OpenAI
    // Cleanup in case GPT adds markdown code blocks
    const cleanJson = aiResponse?.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsedData = JSON.parse(cleanJson || '{}')

    return new Response(JSON.stringify(parsedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      priority: 'Medium',
      suggested_due_date: null,
      reasoning: 'Analysis failed',
      confidence: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
