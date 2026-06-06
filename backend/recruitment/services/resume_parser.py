"""
recruitment/services/resume_parser.py

Extracts raw text and structured information from uploaded PDF and DOCX
resume files. Designed to be called once at upload time; results are
stored in the resume table so future evaluations never re-parse.
"""
import re
import logging
import os

logger = logging.getLogger('recruitment')


class ResumeParser:
    """
    Parses resume files (PDF/DOCX) to extract:
      - raw text
      - experience years (from date ranges)
      - education level
      - certifications (keyword-based)
      - project section presence
    """

    # Common education keywords mapped to normalised level
    EDUCATION_KEYWORDS = {
        'phd': 'Ph.D',
        'doctorate': 'Ph.D',
        'm.tech': 'M.Tech',
        'mtech': 'M.Tech',
        'm.e': 'M.E',
        'master': 'Masters',
        'mba': 'MBA',
        'b.tech': 'B.Tech',
        'btech': 'B.Tech',
        'b.e': 'B.E',
        'bachelor': 'Bachelors',
        'b.sc': 'B.Sc',
        'bsc': 'B.Sc',
        'diploma': 'Diploma',
        '10+2': '12th',
        'hsc': '12th',
        'ssc': '10th',
    }

    # Common certification keywords
    CERT_KEYWORDS = [
        'aws certified', 'azure certified', 'gcp certified',
        'google cloud', 'pmp', 'scrum master', 'csm', 'cissp',
        'comptia', 'oracle certified', 'salesforce certified',
        'docker certified', 'kubernetes', 'tensorflow', 'pytorch',
        'coursera', 'udemy', 'edx', 'nptel',
    ]

    def extract_text(self, file_path: str) -> str:
        """
        Dispatch to the correct extractor based on file extension.
        Returns extracted text, or empty string on failure.
        """
        ext = os.path.splitext(file_path)[1].lower()
        try:
            if ext == '.pdf':
                return self.extract_text_from_pdf(file_path)
            elif ext in ('.docx', '.doc'):
                return self.extract_text_from_docx(file_path)
            else:
                logger.warning(f"Unsupported resume format: {ext} — {file_path}")
                return ''
        except Exception as e:
            logger.error(f"Failed to extract text from {file_path}: {e}")
            return ''

    def extract_text_from_pdf(self, path: str) -> str:
        """Read text from all pages of a PDF using PyPDF2."""
        try:
            import PyPDF2
            text_parts = []
            with open(path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
            return '\n'.join(text_parts)
        except ImportError:
            logger.error("PyPDF2 is not installed. Run: pip install PyPDF2")
            return ''
        except Exception as e:
            logger.error(f"PDF parse error for {path}: {e}")
            return ''

    def extract_text_from_docx(self, path: str) -> str:
        """Read text from all paragraphs of a DOCX file."""
        try:
            import docx
            doc = docx.Document(path)
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            return '\n'.join(paragraphs)
        except ImportError:
            logger.error("python-docx is not installed. Run: pip install python-docx")
            return ''
        except Exception as e:
            logger.error(f"DOCX parse error for {path}: {e}")
            return ''

    def extract_experience_years(self, text: str) -> float:
        """
        Estimate total years of experience by finding date ranges in the text.
        Matches patterns like: 2019–2023, Jan 2018 - Mar 2022, 2020-present.
        Returns total calculated years, capped at 40.
        """
        if not text:
            return 0.0

        total_months = 0
        current_year = 2025

        # Pattern: YYYY–YYYY or YYYY - YYYY
        year_range_pattern = r'\b(20\d{2}|19\d{2})\s*[-–—to]+\s*(20\d{2}|19\d{2}|present|current|now)\b'
        matches = re.findall(year_range_pattern, text, re.IGNORECASE)

        for start_str, end_str in matches:
            try:
                start = int(start_str)
                end = current_year if end_str.lower() in ('present', 'current', 'now') else int(end_str)
                if end >= start and (end - start) <= 15:  # sanity check
                    total_months += (end - start) * 12
            except ValueError:
                continue

        years = round(total_months / 12, 1)
        return min(years, 40.0)

    def detect_education(self, text: str) -> str:
        """
        Return the highest detected education level from the resume text.
        Checks for known degree keywords in a priority order.
        """
        if not text:
            return ''

        lower_text = text.lower()

        # Priority order: highest → lowest
        priority = [
            'phd', 'doctorate', 'm.tech', 'mtech', 'm.e',
            'master', 'mba', 'b.tech', 'btech', 'b.e',
            'bachelor', 'b.sc', 'bsc', 'diploma', '10+2', 'hsc',
        ]

        for keyword in priority:
            if keyword in lower_text:
                return self.EDUCATION_KEYWORDS[keyword]

        return ''

    def extract_certifications(self, text: str) -> list[str]:
        """
        Return a list of certification names found in the resume text.
        """
        if not text:
            return []

        lower_text = text.lower()
        found = [cert for cert in self.CERT_KEYWORDS if cert in lower_text]
        return found

    def extract_skills_from_text(self, text: str, known_skills: list[str]) -> list[str]:
        """
        Match extracted text against the provided list of known skills
        (loaded from the skill_master table). Case-insensitive exact match.
        Returns list of matched skill names (original case from known_skills).
        """
        if not text or not known_skills:
            return []

        lower_text = text.lower()
        matched = []
        for skill in known_skills:
            # Word boundary match to avoid 'C' matching inside 'JavaScript'
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, lower_text):
                matched.append(skill)
        return matched

    def has_projects_section(self, text: str) -> bool:
        """Detect if resume has a projects section."""
        if not text:
            return False
        return bool(re.search(r'\bprojects?\b', text, re.IGNORECASE))


# Singleton instance for import convenience
resume_parser = ResumeParser()
