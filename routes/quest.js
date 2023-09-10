import { Router } from "express";;
import { createQuest, deleteQuestById, getQuest, getQuestById, getQuestParticipantsById, joinOrLeaveQuest, questComplete, recommendQuest, updateQuestById } from "../controller/quest.js";
import { verifyCreator, verifyUser } from "../middleware/auth.js";
import { upload } from "../middleware/uploadImg.js";

const router = Router()

router.get("/", getQuest)
router.get("/:id/find", verifyUser, getQuestById)
router.get("/:id/participants", getQuestParticipantsById)
router.get("/recommend", recommendQuest)

router.post("/locations/:locationId", verifyCreator, upload.single('img'), createQuest)

router.put("/:id", verifyCreator, upload.single('img'), updateQuestById)

router.patch("/:id/complete", verifyCreator, questComplete)
router.patch("/:id/join-leave", verifyUser, joinOrLeaveQuest)

router.delete("/:id", verifyCreator, deleteQuestById)



export default router