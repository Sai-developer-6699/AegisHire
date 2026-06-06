"""
recruitment/services/scoring_engine.py

Deterministic, weighted scoring engine. No AI involved.
Scores are reproducible, auditable, and stable.

Weights:
    Skills     → 50%
    Experience → 30%
    Education  → 20%
"""
import logging

logger = logging.getLogger('recruitment')

# Education hierarchy for comparison (higher index = higher qualification)
EDUCATION_HIERARCHY = [
    '10th', '12th', 'Diploma', 'B.Sc', 'B.E', 'B.Tech', 'Bachelors',
    'MBA', 'M.E', 'M.Tech', 'Masters', 'Ph.D'
]


class ScoringEngine:
    """
    Computes a deterministic match score between a candidate's parsed
    profile and a job requirement.

    All inputs are plain Python dicts — no Django models required,
    making this fully unit-testable.
    """

    WEIGHTS = {
        'skills': 0.50,
        'experience': 0.30,
        'education': 0.20,
    }

    def score(self, resume_profile: dict, job_requirements: dict) -> dict:
        """
        Compute a weighted score for a candidate against a job requirement.

        Args:
            resume_profile: {
                'extracted_skills':   list[str],
                'experience_years':   float,
                'education_detected': str,
            }
            job_requirements: {
                'required_skills':    list[str],
                'experience_range':   str,   e.g. "2-4 years" or "3+"
                'required_education': list[str],
            }

        Returns:
            {
                'score':           float,    # 0.0–100.0
                'matched_skills':  list[str],
                'missing_skills':  list[str],
                'skill_pct':       float,    # 0.0–1.0
                'experience_pct':  float,    # 0.0–1.0
                'education_pct':   float,    # 0.0–1.0
                'experience_gap':  float,    # +ve = over, -ve = under
                'education_match': bool,
            }
        """
        skill_result = self._score_skills(
            resume_profile.get('extracted_skills', []),
            job_requirements.get('required_skills', [])
        )
        exp_result = self._score_experience(
            resume_profile.get('experience_years', 0.0),
            job_requirements.get('experience_range', '0')
        )
        edu_result = self._score_education(
            resume_profile.get('education_detected', ''),
            job_requirements.get('required_education', [])
        )

        final_score = (
            skill_result['pct'] * self.WEIGHTS['skills'] +
            exp_result['pct']   * self.WEIGHTS['experience'] +
            edu_result['pct']   * self.WEIGHTS['education']
        ) * 100

        final_score = round(min(final_score, 100.0), 2)

        logger.debug(
            f"Score breakdown — skills={skill_result['pct']:.2f} "
            f"exp={exp_result['pct']:.2f} edu={edu_result['pct']:.2f} "
            f"→ {final_score}"
        )

        return {
            'score':           final_score,
            'matched_skills':  skill_result['matched'],
            'missing_skills':  skill_result['missing'],
            'skill_pct':       skill_result['pct'],
            'experience_pct':  exp_result['pct'],
            'education_pct':   edu_result['pct'],
            'experience_gap':  exp_result['gap'],
            'education_match': edu_result['match'],
        }

    # ─── Private helpers ────────────────────────────────────────────────────

    def _score_skills(self, candidate_skills: list, required_skills: list) -> dict:
        """
        Compute skill match ratio.
        matched / total_required (capped at 1.0).
        """
        if not required_skills:
            return {'pct': 1.0, 'matched': [], 'missing': []}

        candidate_lower = {s.lower() for s in candidate_skills}
        matched = [s for s in required_skills if s.lower() in candidate_lower]
        missing = [s for s in required_skills if s.lower() not in candidate_lower]

        pct = len(matched) / len(required_skills)
        return {'pct': pct, 'matched': matched, 'missing': missing}

    def _score_experience(self, candidate_years: float, experience_range: str) -> dict:
        """
        Parse experience_range string (e.g. '2-4 years', '3+', '5')
        and return a score based on how close the candidate is.

        Logic:
            candidate >= min_required  → full score (1.0)
            candidate in [min*0.6, min) → partial score (linear ramp)
            candidate < min*0.6        → 0.0
            candidate > max            → capped at 1.0 (experience is a bonus)
        """
        if not experience_range or candidate_years is None:
            return {'pct': 0.5, 'gap': 0.0}   # neutral if unknown

        min_req, max_req = self._parse_experience_range(str(experience_range))

        gap = round(candidate_years - min_req, 1)

        if candidate_years >= min_req:
            pct = 1.0
        elif min_req > 0 and candidate_years >= min_req * 0.6:
            pct = (candidate_years - min_req * 0.6) / (min_req - min_req * 0.6)
        else:
            pct = 0.0

        return {'pct': round(pct, 3), 'gap': gap}

    def _parse_experience_range(self, range_str: str) -> tuple[float, float]:
        """
        Parse strings like '2-4 years', '3+', '5 years', '0-1' into (min, max).
        """
        import re
        range_str = range_str.lower().replace('years', '').replace('year', '').strip()

        # Pattern: "2-4" or "2 - 4"
        match = re.match(r'(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)', range_str)
        if match:
            return float(match.group(1)), float(match.group(2))

        # Pattern: "3+" or "3 +"
        match = re.match(r'(\d+(?:\.\d+)?)\s*\+', range_str)
        if match:
            return float(match.group(1)), 99.0

        # Pattern: single number "5"
        match = re.match(r'(\d+(?:\.\d+)?)', range_str)
        if match:
            val = float(match.group(1))
            return val, val

        return 0.0, 99.0  # fallback: no requirement

    def _score_education(self, candidate_edu: str, required_education: list) -> dict:
        """
        Score education match.
        Full score if candidate_edu meets or exceeds ANY item in required_education.
        Partial score if one level below the minimum required.
        """
        if not required_education:
            return {'pct': 1.0, 'match': True}

        if not candidate_edu:
            return {'pct': 0.0, 'match': False}

        candidate_idx = self._edu_index(candidate_edu)

        # Find the minimum required education level
        required_indices = [self._edu_index(e) for e in required_education]
        min_required_idx = min(required_indices) if required_indices else 0

        if candidate_idx >= min_required_idx:
            return {'pct': 1.0, 'match': True}
        elif candidate_idx == min_required_idx - 1:
            return {'pct': 0.6, 'match': False}
        else:
            return {'pct': 0.0, 'match': False}

    def _edu_index(self, education: str) -> int:
        """Return the index of an education level in the hierarchy. -1 if unknown."""
        for i, level in enumerate(EDUCATION_HIERARCHY):
            if level.lower() == education.lower():
                return i
        return -1


# Singleton instance for import convenience
scoring_engine = ScoringEngine()
