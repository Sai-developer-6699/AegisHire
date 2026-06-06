"""
recruitment/services/ai_service.py

Abstract AI service with Gemini and Ollama implementations.
Switch providers by setting AI_PROVIDER env var.

Gemini does NOT generate scores. It only produces human-readable
explanations grounded in the deterministic score breakdown.
"""
import os
import json
import logging
from abc import ABC, abstractmethod

logger = logging.getLogger('recruitment')


class AIService(ABC):
    """Abstract interface for all AI operations."""

    @abstractmethod
    def explain_candidate(
        self,
        resume_text: str,
        job_requirements: dict,
        score_breakdown: dict
    ) -> dict:
        """
        Produce human-readable explanation for a deterministic score.

        Args:
            resume_text:    Extracted text from the resume (first 3000 chars used)
            job_requirements: { position, experience_range, required_skills, required_education }
            score_breakdown:  Output from ScoringEngine.score()

        Returns:
            {
                'summary':             str,
                'strengths':           list[str],
                'concerns':            list[str],
                'suggested_questions': list[str],
            }
        """

    @abstractmethod
    def generate_exam_questions(
        self,
        position: str,
        skills: list[str],
        num_technical: int = 6,
        num_problem_solving: int = 2,
        num_behavioral: int = 2,
        difficulty: str = 'medium'
    ) -> list[dict]:
        """
        Generate exam questions for a position based on configurable blueprint.

        Returns list of:
            { text, type (mcq|open_ended), options (list or None), correct_answer (or None), category, skill }
        """

    @abstractmethod
    def copilot_answer(self, question: str, context_data: dict) -> str:
        """
        Answer a recruiter question using provided context data (RAG).

        Args:
            question:     Recruiter's natural language question
            context_data: Structured data retrieved from DB (candidates, scores, etc.)

        Returns:
            str — Conversational answer grounded in context_data
        """


# ─── Gemini Implementation ──────────────────────────────────────────────────

class GeminiAIService(AIService):
    """
    Uses Google Gemini API (gemini-2.0-flash).
    Free tier: 1,500 requests/day, 60 RPM.
    """

    MODEL_NAME = 'gemini-2.0-flash'

    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. Add it to your .env file."
            )
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            self._model = genai.GenerativeModel(self.MODEL_NAME)
            logger.info(f"Gemini AI service initialized (model: {self.MODEL_NAME})")
        except ImportError:
            raise RuntimeError(
                "google-generativeai is not installed. Run: pip install google-generativeai"
            )

    def _generate(self, prompt: str) -> str:
        """Call Gemini and return raw text. Raises on API error."""
        try:
            response = self._model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            raise

    def _parse_json_response(self, text: str, fallback: dict) -> dict:
        """Extract JSON from Gemini response. Uses fallback on parse failure."""
        # Strip markdown code fences if present
        clean = text.strip()
        if clean.startswith('```'):
            lines = clean.split('\n')
            clean = '\n'.join(lines[1:-1]) if len(lines) > 2 else clean

        try:
            return json.loads(clean)
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse Gemini JSON response: {clean[:200]}")
            return fallback

    def explain_candidate(self, resume_text, job_requirements, score_breakdown) -> dict:
        fallback = {
            'summary': 'AI explanation unavailable.',
            'strengths': [],
            'concerns': [],
            'suggested_questions': [],
        }

        prompt = f"""You are an expert technical recruiter providing candidate evaluation feedback.

The scoring system has already computed the following DETERMINISTIC scores:
  Overall Score     : {score_breakdown.get('score', 0)}/100
  Skills Match      : {score_breakdown.get('skill_pct', 0)*100:.0f}%
  Experience Match  : {score_breakdown.get('experience_pct', 0)*100:.0f}%
  Education Match   : {score_breakdown.get('education_pct', 0)*100:.0f}%

Matched Skills  : {', '.join(score_breakdown.get('matched_skills', [])) or 'None'}
Missing Skills  : {', '.join(score_breakdown.get('missing_skills', [])) or 'None'}
Experience Gap  : {score_breakdown.get('experience_gap', 0):+.1f} years
Education Match : {'Yes' if score_breakdown.get('education_match') else 'No'}

Job: {job_requirements.get('position', 'Unknown')}
Required Experience: {job_requirements.get('experience_range', 'Not specified')}

Resume Excerpt (first 3000 characters):
{resume_text[:3000]}

Based ONLY on the above data, respond with a JSON object:
{{
  "summary": "2-sentence professional summary of this candidate",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "concerns": ["concern 1", "concern 2"],
  "suggested_questions": ["interview question 1", "interview question 2", "interview question 3"]
}}

Respond with ONLY the JSON. No markdown, no explanation."""

        try:
            raw = self._generate(prompt)
            return self._parse_json_response(raw, fallback)
        except Exception:
            return fallback

    def generate_exam_questions(
        self,
        position,
        skills,
        num_technical=6,
        num_problem_solving=2,
        num_behavioral=2,
        difficulty='medium'
    ) -> list:
        total_questions = num_technical + num_problem_solving + num_behavioral
        prompt = f"""You are a senior technical interviewer creating an exam for candidates applying for the role of {position}.

Required Skills: {', '.join(skills)}
Difficulty: {difficulty}

Generate exactly {total_questions} questions in total, structured as follows:
- {num_technical} Technical questions (focused on core engineering and code concepts)
- {num_problem_solving} Problem Solving questions (focused on logic, debugging, or optimization)
- {num_behavioral} Behavioral questions (focused on teamwork, collaboration, and past scenarios)

Ensure questions are role-specific and cover a mix of MCQ (70%) and open-ended (30%) formats.

For every question, you MUST include the "category" (exactly one of 'Technical', 'Problem Solving', 'Behavioral') and the target "skill" it assesses.

Respond with ONLY a JSON array, with no markdown code blocks:
[
  {{
    "text": "question text",
    "type": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A",
    "category": "Technical",
    "skill": "React Core"
  }},
  {{
    "text": "open ended question text",
    "type": "open_ended",
    "options": null,
    "correct_answer": null,
    "category": "Behavioral",
    "skill": "Conflict Resolution"
  }}
]
"""

        try:
            raw = self._generate(prompt)
            clean = raw.strip()
            if clean.startswith('```'):
                lines = clean.split('\n')
                clean = '\n'.join(lines[1:-1])
            return json.loads(clean)
        except Exception as e:
            logger.error(f"Exam question generation failed: {e}")
            return []

    def copilot_answer(self, question: str, context_data: dict) -> str:
        candidates_text = ''
        candidates = context_data.get('candidates', [])
        for c in candidates[:5]:
            candidates_text += (
                f"  • {c.get('name', 'Unknown')} — Score: {c.get('score', 0)}/100 | "
                f"Matched: {', '.join(c.get('matched_skills', []))} | "
                f"Missing: {', '.join(c.get('missing_skills', []))}\n"
            )

        prompt = f"""You are an AI Recruiter Copilot for SafeNet, an enterprise AI recruitment platform.

The recruiter is asking: "{question}"

Available candidate data for position: {context_data.get('position', 'Unknown')}
{candidates_text if candidates_text else '  No candidates evaluated yet.'}

Job Requirements:
  Skills: {', '.join(context_data.get('required_skills', []))}
  Experience: {context_data.get('experience_range', 'Not specified')}

Answer the recruiter's question concisely and professionally.
Reference specific candidate names and scores from the data above.
If the data is insufficient to answer, say so clearly.
Keep the response under 150 words."""

        try:
            return self._generate(prompt)
        except Exception as e:
            return f"AI Copilot is temporarily unavailable. Please try again. ({type(e).__name__})"


# ─── Ollama Implementation ──────────────────────────────────────────────────

class OllamaAIService(AIService):
    """
    Uses a locally-running Ollama instance.
    Requires: ollama installed + model pulled (e.g. ollama pull mistral).
    AI_PROVIDER=ollama
    """

    def __init__(self):
        self.base_url = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
        self.model = os.getenv('OLLAMA_MODEL', 'mistral')
        logger.info(f"Ollama AI service initialized (model: {self.model}, url: {self.base_url})")

    def _generate(self, prompt: str) -> str:
        import requests
        payload = {
            'model': self.model,
            'prompt': prompt,
            'stream': False,
            'options': {'temperature': 0.3, 'num_predict': 1000},
        }
        try:
            response = requests.post(
                f'{self.base_url}/api/generate',
                json=payload,
                timeout=120
            )
            response.raise_for_status()
            return response.json().get('response', '').strip()
        except Exception as e:
            logger.error(f"Ollama API error: {e}")
            raise

    def explain_candidate(self, resume_text, job_requirements, score_breakdown) -> dict:
        # Same prompt structure as Gemini for provider parity
        gemini_service = GeminiAIService.__new__(GeminiAIService)
        prompt = (
            f"Score: {score_breakdown.get('score')}/100. "
            f"Matched: {score_breakdown.get('matched_skills')}. "
            f"Missing: {score_breakdown.get('missing_skills')}. "
            f"Job: {job_requirements.get('position')}. "
            f"Resume: {resume_text[:2000]}. "
            "Return JSON: {summary, strengths (list), concerns (list), suggested_questions (list)}"
        )
        try:
            raw = self._generate(prompt)
            import json
            return json.loads(raw)
        except Exception:
            return {'summary': '', 'strengths': [], 'concerns': [], 'suggested_questions': []}

    def generate_exam_questions(
        self,
        position,
        skills,
        num_technical=6,
        num_problem_solving=2,
        num_behavioral=2,
        difficulty='medium'
    ) -> list:
        total_questions = num_technical + num_problem_solving + num_behavioral
        prompt = (
            f"Create exactly {total_questions} {difficulty} exam questions for {position}. "
            f"Skills: {', '.join(skills)}. "
            f"Mix: {num_technical} Technical, {num_problem_solving} Problem Solving, {num_behavioral} Behavioral. "
            "Return JSON array: [{text, type (mcq/open_ended), options (list or null), correct_answer, category, skill}]"
        )
        try:
            raw = self._generate(prompt)
            import json
            return json.loads(raw)
        except Exception:
            return []

    def copilot_answer(self, question: str, context_data: dict) -> str:
        candidates = context_data.get('candidates', [])[:3]
        context_str = '; '.join(
            f"{c.get('name')} ({c.get('score')}/100)" for c in candidates
        )
        prompt = (
            f"Recruiter question: {question}. "
            f"Candidates: {context_str}. "
            "Answer concisely in 3-4 sentences."
        )
        try:
            return self._generate(prompt)
        except Exception as e:
            return f"AI Copilot unavailable. ({type(e).__name__})"


# ─── Factory ────────────────────────────────────────────────────────────────

_ai_service_instance = None


def get_ai_service() -> AIService:
    """
    Factory function — returns the correct AIService implementation
    based on the AI_PROVIDER environment variable.
    Caches the instance after first creation.
    """
    global _ai_service_instance

    if _ai_service_instance is not None:
        return _ai_service_instance

    provider = os.getenv('AI_PROVIDER', 'gemini').lower()

    if provider == 'ollama':
        _ai_service_instance = OllamaAIService()
    else:
        try:
            _ai_service_instance = GeminiAIService()
        except Exception as e:
            logger.warning(f"Gemini init failed ({e}). AI features will be degraded.")
            _ai_service_instance = None

    return _ai_service_instance
