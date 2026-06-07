from django.urls import path
from .views import (
    login_api,
    home,
    register_api,
    get_all_users,
    get_user_by_username,
    update_user_by_username,
    delete_user,
    get_user_by_id,
    get_recommendations_for_position,
    submit_job,
    get_recent_jobs,
    check_session,
    logout_api,
    dashboard,
    list_job_requirements,
    get_positions,
    get_job_requirement_detail,
    upload_candidate_resume,
    get_recent_resumes,
    evaluate_with_ai,
    user_profile,
    get_resumes_with_scores,
    shortlist_resumes,
    positions_with_shortlisted,
    get_shortlisted_candidates,
    approve_shortlisted_candidates,
    hr_list_candidates_for_interview,
    hr_schedule_interview,
    hr_list_scheduled_interviews,
    manager_list_candidates_performance,
    manager_get_exam_answers,
    manager_update_exam_scores,
    hr_list_finalised_candidates,
    hr_update_finalised_status,
    candidate_start_exam_session,
    candidate_submit_exam_answers,
    candidate_exam_status,
    # ── New endpoints (Phase 3–8) ─────────────────────────────────────
    evaluation_status,
    search_candidates,
    candidate_ai_details,
    audit_log_timeline,
    generate_exam_questions,
    copilot_chat,
    pipeline_stages,
    pipeline_move,
    assign_job_requirement,
    unassign_job_requirement,
    hr_list_question_bank,
    hr_create_question_bank,
    hr_update_question_bank,
    hr_approve_question_bank,
    hr_publish_question_bank,
    candidate_list_exam_questions,
    get_notices,
    mark_notice_read,
    update_job_status,
)
from django.urls import include
# recruitment/urls.py


urlpatterns = [
    path('', home, name='home'), 
    path('login/', login_api, name='api-login'),
    path('api/register/', register_api, name='register'),
    path('api/get-users/', get_all_users, name='get-users'),
    path('api/get-user-by-username/<str:username>/', get_user_by_username, name='get-user-by-username'),
    path('api/update-user-by-username/<str:username>/', update_user_by_username, name='update-user-by-username'),
    path('api/delete-user/<int:userid>/', delete_user),
    path('api/get-user-by-id/<int:userid>/', get_user_by_id, name='get-user-by-id'),
    path('api/get_recommendations_for_position/', get_recommendations_for_position, name='get_recommendations_for_position'),
    path('api/submit_job/', submit_job, name='submit_job'),
    path('api/hr/assign-job/', assign_job_requirement, name='assign-job-requirement'),
    path('api/hr/unassign-job/', unassign_job_requirement, name='unassign-job-requirement'),
    path('api/get-recent-jobs/', get_recent_jobs, name='get-recent-jobs'),
    path('api/check_session/', check_session, name='check_session'),
    path('api/logout/', logout_api, name='logout'),
    path('api/dashboard/', dashboard, name='dashboard'),
    path('api/get_positions/', get_positions, name='get_positions'),
    path('api/list_job_requirements/',list_job_requirements, name='list_job_requirements'),
    path('api/get_job_requirement_detail/<int:requirement_id>/',get_job_requirement_detail, name='get_job_requirement_detail'),
    path('api/hr/upload/', upload_candidate_resume),
    path('api/hr/recent-resumes/', get_recent_resumes, name='recent_resumes'),
    path('api/evaluate/', evaluate_with_ai, name='evaluate_with_ai'),
    path('api/user-profile/', user_profile, name='user_profile'),
    path('api/hr/resumes/<int:requirement_id>/', get_resumes_with_scores, name='get_resumes_with_scores'),
    path('api/hr/shortlist/', shortlist_resumes, name='shortlist_resumes'),
    path('api/manager/positions-in-shortlisted/', positions_with_shortlisted, name='positions_with_shortlisted'),
    path('api/manager/shortlist-details/<int:requirement_id>/', get_shortlisted_candidates, name='get_shortlisted_candidates'),
    path('api/manager/approve-shortlist/', approve_shortlisted_candidates, name='approve_shortlisted_candidates'),
]

# --- HR Interview Scheduling ---
urlpatterns += [
    path('api/hr/interview-candidates/', hr_list_candidates_for_interview, name='hr-interview-candidates'),
    path('api/hr/schedule-interview/', hr_schedule_interview, name='hr-schedule-interview'),
    path('api/hr/scheduled-interviews/', hr_list_scheduled_interviews, name='hr-scheduled-interviews'),
]

# --- Manager Candidate Performance ---
urlpatterns += [
    path('api/manager/performance/<int:requirement_id>/', manager_list_candidates_performance, name='manager-candidate-performance'),
    path('api/manager/exam-answers/<int:map_id>/', manager_get_exam_answers, name='manager-exam-answers'),
    path('api/manager/update-exam-scores/', manager_update_exam_scores, name='manager-update-exam-scores'),
]

# --- HR Finalised Candidate Actions ---
urlpatterns += [
    path('api/hr/finalised-candidates/', hr_list_finalised_candidates, name='hr-finalised-candidates'),
    path('api/hr/update-finalised-status/', hr_update_finalised_status, name='hr-update-finalised-status'),
]

# --- Candidate Exam Lifecycle ---
urlpatterns += [
    path('api/candidate/start-exam/', candidate_start_exam_session, name='candidate-start-exam'),
    path('api/candidate/submit-answers/', candidate_submit_exam_answers, name='candidate-submit-answers'),
    path('api/candidate/exam-status/<int:session_id>/', candidate_exam_status, name='candidate-exam-status'),
]

# --- New Endpoints: Phase 3–8 ---
urlpatterns += [
    # Evaluation progress polling
    path('api/evaluate/status/<int:requirement_id>/', evaluation_status, name='evaluation-status'),

    # Candidate search engine
    path('api/search/candidates/', search_candidates, name='search-candidates'),

    # AI details for CandidateDrawer
    path('api/hr/candidates/<int:resume_id>/ai-details/', candidate_ai_details, name='candidate-ai-details'),

    # Audit trail / activity timeline
    path('api/audit-log/<str:target_type>/<int:target_id>/', audit_log_timeline, name='audit-log-timeline'),

    # AI exam question generation
    path('api/hr/generate-exam-questions/', generate_exam_questions, name='generate-exam-questions'),

    # RAG Copilot chat
    path('api/copilot/chat/', copilot_chat, name='copilot-chat'),

    # Pipeline Kanban board
    path('api/pipeline/stages/', pipeline_stages, name='pipeline-stages'),
    path('api/pipeline/move/', pipeline_move, name='pipeline-move'),

    # Question Bank
    path('api/hr/question-bank/', hr_list_question_bank, name='hr-list-question-bank'),
    path('api/hr/question-bank/create/', hr_create_question_bank, name='hr-create-question-bank'),
    path('api/hr/question-bank/<int:question_id>/', hr_update_question_bank, name='hr-update-question-bank'),
    path('api/hr/question-bank/<int:question_id>/approve/', hr_approve_question_bank, name='hr-approve-question-bank'),
    path('api/hr/question-bank/publish/', hr_publish_question_bank, name='hr-publish-question-bank'),

    # Candidate Exam Questions
    path('api/candidate/exam-questions/<int:session_id>/', candidate_list_exam_questions, name='candidate-list-exam-questions'),

    # Notices/Notifications Center
    path('api/notices/', get_notices, name='get-notices'),
    path('api/notices/<int:notice_id>/read/', mark_notice_read, name='mark-notice-read'),

    # Job Requirement Requisition Status (Close/Reopen/Delete)
    path('api/jobs/<int:requirement_id>/status/', update_job_status, name='update-job-status'),
]
