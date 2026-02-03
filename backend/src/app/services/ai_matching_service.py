"""AI matching logic for referee assignments."""

from typing import List

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.integrations.openai_client import parse_ref_request
from app.models.rating import Rating
from app.models.referee import RefereeProfile
from app.schemas.ai import FindRefRequest, FindRefResult
from app.services.referee_service import search_candidate_refs


def find_best_refs_from_nl(db: Session, req: FindRefRequest) -> FindRefResult:
    constraints = parse_ref_request(req.natural_language_query, req.league_id)
    candidates = search_candidate_refs(db, constraints)

    if not candidates:
        return FindRefResult(suggested_ref_ids=[], explanation="No matching referees found.")

    rating_map = {
        ref_id: avg
        for ref_id, avg in (
            db.query(Rating.referee_id, func.avg(Rating.score))
            .group_by(Rating.referee_id)
            .all()
        )
    }

    def score(ref: RefereeProfile) -> float:
        avg_rating = rating_map.get(ref.id, 0) or 0
        return float(avg_rating)

    ranked = sorted(candidates, key=score, reverse=True)
    top_ids = [ref.id for ref in ranked[:5]]
    explanation = "Ranked by average rating and constraints from the request."
    return FindRefResult(suggested_ref_ids=top_ids, explanation=explanation)
