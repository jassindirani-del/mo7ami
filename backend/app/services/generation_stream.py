"""Streaming answer generation service using LLM with RAG."""

from __future__ import annotations

from typing import Any, AsyncGenerator, Dict, List

from loguru import logger
import openai

from app.core.config import settings


SYSTEM_PROMPTS = {
    "ar": """أنت محامي، مساعد قانوني ذكي متخصص في القانون المغربي. مهمتك:
1. تقديم معلومات دقيقة وموثوقة اعتماداً حصراً على المصادر القانونية المرفقة
2. إبراز الأساس القانوني مع ذكر رقم المادة بالحروف، واسم القانون، ورقم الجريدة الرسمية
3. شرح النصوص القانونية بلغة واضحة مع استعمال الدارجة المغربية بشكل مهني عندما يساعد على الفهم
4. تقديم خطوات عملية قابلة للتنفيذ، مع المتطلبات والآجال والجهات المسؤولة
5. إنهاء الإجابة بتحذير قانوني قصير يؤكد أن المحتوى تعليمي وليس بديلاً عن استشارة محامٍ

قواعد صارمة:
- استعمل فقط المعلومات الموجودة في السياق.
- إذا غابت المعلومة، صرّح بذلك ووجّه المستخدم للجهة المختصة.
- اكتب جميع الأرقام بالحروف (مثال: "ثلاثون يوماً"، "ألف وتسعمائة وخمسة وستون").
- في قسم "📚 المراجع الرسمية" أدرج قائمة نقطية بصيغة:
  • **اسم القانون الكامل** — المادة [بالحروف] — المرجع الرسمي [رقم الظهير أو القانون] — معرف المستند: [document_id]
- لا تخترع روابط. إن لم يوجد رابط موثوق، استخدم https://www.sgg.gov.ma.
""",
    "fr": """Tu es Mo7ami, un assistant juridique intelligent spécialisé dans le droit marocain. Ta mission :
1. Fournir une réponse rigoureuse basée uniquement sur les sources juridiques fournies
2. Mettre en avant la base légale en citant l'article en toutes lettres, le nom complet de la loi et le Bulletin Officiel
3. Expliquer de façon claire et accessible, avec une tonalité professionnelle mais bienveillante
4. Proposer des étapes pratiques (documents requis, délais, autorités compétentes)
5. Conclure par un rappel que l'information est pédagogique et ne remplace pas l'avis d'un avocat

Règles strictes :
- Utilise uniquement le contexte fourni.
- Indique explicitement quand l'information manque et invite à consulter l'autorité compétente.
- Écris tous les nombres en toutes lettres (par ex. « trente jours », « mille neuf cent soixante-cinq »).
- Dans la section « 📚 Sources officielles », liste chaque référence au format :
  • **Nom complet de la loi** — article [en toutes lettres] — référence officielle [Dahir/Loi] — document_id : [document_id]
- Ne fabrique pas de liens. À défaut de source précise, renvoie vers https://www.sgg.gov.ma.
""",
}


async def generate_answer_stream(
    *, query: str, documents: List[Dict[str, Any]], language: str = "ar"
) -> AsyncGenerator[str, None]:
    """Stream answer generation using the retrieved legal context."""

    logger.info("Streaming answer for query in {} with {} documents", language, len(documents))

    # Build context for the LLM
    context = _build_context(documents, language)

    if not context:
        logger.warning("No legal context available for query")
        yield _fallback_answer(language)
        return

    if language == "ar":
        user_prompt = f"""السؤال: {query}

المصادر القانونية المتاحة:
{context}

تعليمات صارمة:
1. استعمل المصادر أعلاه فقط - لا تخترع أي معلومات
2. أجب باللغة العربية فقط
3. لا تخترع روابط أو مراجع - استخدم معرف المستند (document_id) الموجود في السياق
4. إذا لم تجد المعلومة في السياق، قل ذلك صراحة
5. اذكر رقم المادة ورقم المستند (document_id) في الاستشهادات

قدم جواباً مفصلاً مع الاستشهاد بالمراجع."""
    else:
        user_prompt = f"""Question : {query}

Sources juridiques mises à disposition :
{context}

Instructions strictes :
1. Utilise uniquement ces sources - n'invente aucune information
2. Réponds en français uniquement
3. N'invente pas de liens ou références - utilise le document_id présent dans le contexte
4. Si l'information n'est pas dans le contexte, dis-le clairement
5. Cite le numéro d'article et le document_id dans les références

Fournis une réponse détaillée avec citations."""

    try:
        client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        stream = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPTS[language]},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=1600,
            stream=True,  # Enable streaming
        )

        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

        logger.info("Streaming answer generated successfully")

    except Exception as exc:
        logger.error(f"Streaming generation error: {exc}")
        raise


def _build_context(documents: List[Dict[str, Any]], language: str) -> str:
    """Build the contextual prompt block from retrieved chunks."""

    context_parts: List[str] = []

    for index, doc in enumerate(documents, start=1):
        legal_doc = doc.get("document", {})
        metadata = doc.get("metadata") or {}

        title = legal_doc.get("title") or legal_doc.get("title_ar") or "مصدر قانوني"
        official_ref = legal_doc.get("official_ref", "")
        article_number = doc.get("article_number") or metadata.get("article")
        similarity = doc.get("similarity")

        document_id = legal_doc.get("id")
        header_parts = [f"[{index}] {title}"]
        if official_ref:
            header_parts.append(f"المرجع: {official_ref}" if language == "ar" else f"Référence : {official_ref}")
        if article_number:
            header_parts.append(
                f"المادة: {article_number}" if language == "ar" else f"Article : {article_number}"
            )
        if document_id:
            header_parts.append(
                f"معرف المستند: {document_id}" if language == "ar" else f"document_id : {document_id}"
            )
        if similarity is not None:
            header_parts.append(f"التشابه: {similarity:.2f}" if language == "ar" else f"Similarité : {similarity:.2f}")

        header = " • ".join(header_parts)
        content = doc.get("content", "")

        if not content:
            continue

        context_parts.append(f"{header}\n{content}")

    return "\n\n".join(context_parts)


def _fallback_answer(language: str) -> str:
    """Return a graceful message when no documents are available."""

    if language == "fr":
        return (
            "Je n'ai trouvé aucune source juridique correspondante dans notre base. "
            "Veuillez reformuler la question ou consulter un avocat pour un conseil spécifique."
        )

    return (
        "ما لقيتش مراجع قانونية مناسبة فالقواعد ديالنا لهذا السؤال. "
        "حاول تبدل صياغة السؤال ولا استاشر مع محام مختص للحالات الفردية."
    )
