import { describe, it, expect } from 'vitest';
import { adaptResume, adaptResumeList } from '../../../../src/services/adapters/resume.adapter';

describe('Resume Adapter', () => {
  it('should handle missing and null fields gracefully with defaults', () => {
    const raw = {};
    const adapted = adaptResume(raw);
    
    expect(adapted.id).toBeNull();
    expect(adapted.name).toBe('Unknown Candidate');
    expect(adapted.email).toBeNull();
    expect(adapted.phone).toBeNull();
    expect(adapted.score).toBeNull();
    expect(adapted.status).toBe('unknown');
    expect(adapted.resumeUrl).toBeNull();
    expect(adapted.uploadedAt).toBeNull();
    expect(adapted.mapId).toBeNull();
    expect(adapted.examScore).toBeNull();
  });

  it('should map snake_case columns from backend to camelCase client keys', () => {
    const raw = {
      resume_id: 101,
      resume_name: 'Jane Doe',
      email: 'jane@example.com',
      phone_number: '+123456789',
      score: '92.50',
      status: 'shortlisted',
      file_location: 'resumes/jane_doe.pdf',
      map_id: 50,
      exam_score: '88.00'
    };

    const adapted = adaptResume(raw);

    expect(adapted.id).toBe(101);
    expect(adapted.name).toBe('Jane Doe');
    expect(adapted.email).toBe('jane@example.com');
    expect(adapted.phone).toBe('+123456789');
    expect(adapted.score).toBe(92.5);
    expect(adapted.status).toBe('shortlisted');
    expect(adapted.resumeUrl).toBe('resumes/jane_doe.pdf');
    expect(adapted.mapId).toBe(50);
    expect(adapted.examScore).toBe(88);
  });

  it('should normalize lists of resumes correctly', () => {
    const rawList = [
      { id: 1, resume_name: 'Alice' },
      { resume_id: 2, name: 'Bob' }
    ];

    const adaptedList = adaptResumeList(rawList);

    expect(adaptedList).toHaveLength(2);
    expect(adaptedList[0].id).toBe(1);
    expect(adaptedList[0].name).toBe('Alice');
    expect(adaptedList[1].id).toBe(2);
    expect(adaptedList[1].name).toBe('Bob');
  });
});
