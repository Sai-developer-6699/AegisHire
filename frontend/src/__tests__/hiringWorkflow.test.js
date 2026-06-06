import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Import all services
import { usersService } from '@/services/users.service';
import { jobsService } from '@/services/jobs.service';
import { resumesService } from '@/services/resumes.service';
import { managerService } from '@/services/manager.service';
import { interviewService } from '@/services/interview.service';
import { examService } from '@/services/exam.service';
import { hrService } from '@/services/hr.service';

const API_BASE = 'http://127.0.0.1:8000';

// Define MSW handlers representing the backend API logic
const handlers = [
  // Admin register user
  http.post(`${API_BASE}/api/register/`, () => {
    return HttpResponse.json({ message: 'User registered successfully.' });
  }),

  // Manager job submission
  http.post(`${API_BASE}/api/submit_job/`, () => {
    return HttpResponse.json({ message: 'Job requirement submitted successfully.' });
  }),

  // HR upload resume
  http.post(`${API_BASE}/api/hr/upload/`, () => {
    return HttpResponse.json({ message: 'Resume uploaded successfully.' });
  }),

  // HR evaluate with AI
  http.post(`${API_BASE}/api/evaluate/`, () => {
    return HttpResponse.json({ message: 'AI evaluation completed.' });
  }),

  // HR list resumes with score for requirement
  http.get(`${API_BASE}/api/hr/resumes/:requirementId/`, ({ params }) => {
    return HttpResponse.json({
      resumes: [
        {
          resume_id: 10,
          resume_name: 'John Doe',
          email: 'john@example.com',
          phone_number: '9876543210',
          score: '87.50',
          status: 'evaluated',
          file_location: 'resumes/john_doe.pdf',
          uploaded_at: '2026-06-02T12:00:00Z'
        }
      ]
    });
  }),

  // HR shortlist candidate
  http.post(`${API_BASE}/api/hr/shortlist/`, () => {
    return HttpResponse.json({ message: 'Candidates shortlisted successfully.' });
  }),

  // Manager positions with shortlist counts
  http.get(`${API_BASE}/api/manager/positions-in-shortlisted/`, () => {
    return HttpResponse.json([
      {
        requirement_id: 1,
        position_name: 'Frontend Developer',
        shortlisted_count: 1
      }
    ]);
  }),

  // Manager shortlisted candidate details
  http.get(`${API_BASE}/api/manager/shortlist-details/:requirementId/`, () => {
    return HttpResponse.json([
      {
        resume_id: 10,
        name: 'John Doe',
        email: 'john@example.com',
        resume_url: 'resumes/john_doe.pdf',
        ai_score: '87.50',
        position_name: 'Frontend Developer'
      }
    ]);
  }),

  // Manager approve shortlisted candidates
  http.post(`${API_BASE}/api/manager/approve-shortlist/`, () => {
    return HttpResponse.json({ message: 'Shortlisted candidates approved.' });
  }),

  // HR list candidates for interview scheduling
  http.get(`${API_BASE}/api/hr/interview-candidates/`, () => {
    return HttpResponse.json({
      candidates: [
        {
          map_id: 101,
          resume_id: 10,
          resume_name: 'John Doe',
          email: 'john@example.com',
          phone_number: '9876543210',
          status: 'approved',
          exam_score: null
        }
      ]
    });
  }),

  // HR schedule interview
  http.post(`${API_BASE}/api/hr/schedule-interview/`, () => {
    return HttpResponse.json({ message: 'Interview scheduled successfully.' });
  }),

  // HR list scheduled interviews
  http.get(`${API_BASE}/api/hr/scheduled-interviews/`, () => {
    return HttpResponse.json({
      interviews: [
        {
          schedule_id: 501,
          map_id: 101,
          candidate_name: 'John Doe',
          interview_datetime: '2026-06-05T10:00:00Z',
          interviewer: 'Alex Smith',
          created_at: '2026-06-02T20:00:00Z'
        }
      ]
    });
  }),

  // Candidate start exam session
  http.post(`${API_BASE}/api/candidate/start-exam/`, () => {
    return HttpResponse.json({
      session_id: 301,
      status: 'in_progress'
    });
  }),

  // Candidate submit answers
  http.post(`${API_BASE}/api/candidate/submit-answers/`, () => {
    return HttpResponse.json({ message: 'Answers submitted successfully.' });
  }),

  // Manager candidate performance list
  http.get(`${API_BASE}/api/manager/performance/:requirementId/`, () => {
    return HttpResponse.json({
      candidates: [
        {
          map_id: 101,
          resume_id: 10,
          resume_name: 'John Doe',
          email: 'john@example.com',
          status: 'submitted',
          exam_score: null
        }
      ]
    });
  }),

  // Manager get exam answers
  http.get(`${API_BASE}/api/manager/exam-answers/:mapId/`, () => {
    return HttpResponse.json({
      session_id: 301,
      answers: [
        {
          answer_id: 901,
          question_id: 1,
          question_text: 'Virtual DOM Question',
          question_type: 'technical',
          options: null,
          answer_text: 'Virtual DOM is a representation of real DOM',
          score_awarded: null,
          is_correct: null
        }
      ]
    });
  }),

  // Manager grade exam answers
  http.post(`${API_BASE}/api/manager/update-exam-scores/`, () => {
    return HttpResponse.json({
      message: 'Scores updated',
      total_score: 95.0
    });
  }),

  // HR list finalised candidates
  http.get(`${API_BASE}/api/hr/finalised-candidates/`, () => {
    return HttpResponse.json({
      candidates: [
        {
          map_id: 101,
          resume_id: 10,
          resume_name: 'John Doe',
          email: 'john@example.com',
          status: 'finalised',
          finalised_at: '2026-06-02T20:30:00Z'
        }
      ]
    });
  }),

  // HR update finalised candidates
  http.post(`${API_BASE}/api/hr/update-finalised-status/`, () => {
    return HttpResponse.json({ message: 'Statuses updated' });
  })
];

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('E2E Recruitment Pipeline Service Workflow', () => {
  it('should successfully execute the entire hiring pipeline sequence from Admin to Candidate to Finalised Status', async () => {
    // 1. [Admin] Register User "hr1"
    const userReg = await usersService.register({
      first_name: 'Alex',
      last_name: 'Morgan',
      email: 'alex@recruitment.com',
      username: 'hr1',
      password: 'password123',
      role: 'hr'
    });
    expect(userReg.message).toBe('User registered successfully.');

    // 2. [Manager] Submit Job Requirement
    const jobSubmit = await jobsService.submitJob({
      position: 'Frontend Developer',
      experience: 'mid',
      technical_skills: ['React', 'JavaScript'],
      soft_skills: ['Communication'],
      education: ['Bachelor CS']
    });
    expect(jobSubmit.message).toBe('Job requirement submitted successfully.');

    // 3. [HR] Upload candidate resume
    const formData = new FormData();
    formData.append('resume', new Blob(['fake-pdf-content'], { type: 'application/pdf' }));
    formData.append('name', 'John Doe');
    formData.append('email', 'john@example.com');
    formData.append('phone', '9876543210');
    formData.append('requirement_id', '1');
    const resumeUpload = await resumesService.upload(formData);
    expect(resumeUpload.message).toBe('Resume uploaded successfully.');

    // 4. [HR] AI evaluation trigger
    const aiEval = await resumesService.evaluate(1);
    expect(aiEval.message).toBe('AI evaluation completed.');

    // 5. [HR] Get evaluated list of resumes
    const evaluatedResumes = await resumesService.getEvaluated(1);
    expect(evaluatedResumes).toHaveLength(1);
    expect(evaluatedResumes[0]).toEqual({
      id: 10,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '9876543210',
      score: 87.5,
      status: 'evaluated',
      resumeUrl: 'resumes/john_doe.pdf',
      uploadedAt: expect.any(String),
      mapId: null,
      examScore: null
    });

    // 6. [HR] Shortlist candidates
    const shortlistRes = await resumesService.shortlist({
      selected_ids: [10],
      requirement_id: 1
    });
    expect(shortlistRes.message).toBe('Candidates shortlisted successfully.');

    // 7. [Manager] Get positions containing shortlisted candidates
    const managerPositions = await managerService.getPositionsWithShortlisted();
    expect(managerPositions).toHaveLength(1);
    expect(managerPositions[0]).toEqual({
      requirementId: 1,
      positionName: 'Frontend Developer',
      shortlistedCount: 1
    });

    // 8. [Manager] Get shortlisted candidate list for requirement 1
    const shortlistedCandidates = await managerService.getShortlistedCandidates(1);
    expect(shortlistedCandidates).toHaveLength(1);
    expect(shortlistedCandidates[0]).toEqual({
      resumeId: 10,
      name: 'John Doe',
      email: 'john@example.com',
      resumeUrl: 'resumes/john_doe.pdf',
      aiScore: 87.5,
      positionName: 'Frontend Developer'
    });

    // 9. [Manager] Approve candidates
    const managerApprove = await managerService.approveShortlist([10], 1);
    expect(managerApprove.message).toBe('Shortlisted candidates approved.');

    // 10. [HR] List candidates eligible for interview scheduling
    const interviewEligible = await interviewService.getCandidatesForInterview();
    expect(interviewEligible).toHaveLength(1);
    expect(interviewEligible[0]).toEqual({
      mapId: 101,
      resumeId: 10,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '9876543210',
      status: 'approved',
      examScore: null
    });

    // 11. [HR] Schedule interview slot
    const hrSchedule = await interviewService.scheduleInterview(101, '2026-06-05T10:00:00', 'Alex Smith');
    expect(hrSchedule.message).toBe('Interview scheduled successfully.');

    // 12. [HR] Get scheduled interview list
    const scheduledList = await interviewService.getScheduledInterviews();
    expect(scheduledList).toHaveLength(1);
    expect(scheduledList[0]).toEqual({
      scheduleId: 501,
      mapId: 101,
      candidateName: 'John Doe',
      interviewDatetime: '2026-06-05T10:00:00Z',
      interviewer: 'Alex Smith',
      createdAt: '2026-06-02T20:00:00Z'
    });

    // 13. [Candidate] Start exam session
    const candidateExamSession = await examService.startExamSession(10, 1);
    expect(candidateExamSession).toEqual({
      sessionId: 301,
      status: 'in_progress',
      startedAt: null,
      completedAt: null,
      message: null
    });

    // 14. [Candidate] Submit exam responses
    const candidateAnswersSubmit = await examService.submitExamAnswers(301, [
      { questionId: 1, answerText: 'React uses reconciliation algorithm.' }
    ]);
    expect(candidateAnswersSubmit.message).toBe('Answers submitted successfully.');

    // 15. [Manager] Get candidate performance overview
    const candidatePerformances = await managerService.getCandidatesPerformance(1);
    expect(candidatePerformances).toHaveLength(1);
    expect(candidatePerformances[0]).toEqual({
      mapId: 101,
      resumeId: 10,
      name: 'John Doe',
      email: 'john@example.com',
      status: 'submitted',
      examScore: null
    });

    // 16. [Manager] Get detailed answers submitted by candidate
    const examAnswers = await managerService.getExamAnswers(101);
    expect(examAnswers.sessionId).toBe(301);
    expect(examAnswers.answers).toHaveLength(1);
    expect(examAnswers.answers[0]).toEqual({
      answerId: 901,
      questionId: 1,
      questionText: 'Virtual DOM Question',
      questionType: 'technical',
      options: null,
      answerText: 'Virtual DOM is a representation of real DOM',
      scoreAwarded: null,
      isCorrect: null
    });

    // 17. [Manager] Award grading scores
    const gradeSubmission = await managerService.updateExamScores(301, [
      { answerId: 901, scoreAwarded: 95.0, isCorrect: true }
    ]);
    expect(gradeSubmission.message).toBe('Scores updated');
    expect(gradeSubmission.total_score).toBe(95.0);

    // 18. [HR] Get finalised candidates
    const hrFinalised = await hrService.getFinalisedCandidates();
    expect(hrFinalised).toHaveLength(1);
    expect(hrFinalised[0]).toEqual({
      mapId: 101,
      resumeId: 10,
      name: 'John Doe',
      email: 'john@example.com',
      status: 'finalised',
      finalisedAt: '2026-06-02T20:30:00Z'
    });

    // 19. [HR] Mark candidate recruitment outcome as Joined
    const hrUpdateJoinedStatus = await hrService.updateFinalisedStatus([
      { mapId: 101, newStatus: 'joined' }
    ]);
    expect(hrUpdateJoinedStatus.message).toBe('Statuses updated');
  });
});
