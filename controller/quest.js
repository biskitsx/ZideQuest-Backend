import Quest from '../model/quest.js'
import Admin from '../model/admin.js'
import Location from '../model/location.js'
import { createError } from '../util/createError.js'
import { cloudinaryUploadImg } from '../util/cloudinary.js'
import User from '../model/user.js'

export const createQuest = async (req, res, next) => {
    try {
        // validate location
        const { id } = req.user
        const { locationId } = req.params
        const location = await Location.findById(locationId)
        if (!location) { return next(createError(400, "Location not found")) }

        // if quest has a picture
        let imagePath = "";
        if (req.file?.img) {
            const newPath = await cloudinaryUploadImg(req.file.img)
            imagePath = newPath.url
        }

        // create quest
        const quest = await Quest.create({
            ...req.body,
            creatorId: id,
            locationId: locationId,
            imagePath
        }
        )
        return res.json(quest)
    } catch (error) {
        next(error)
    }
}
export const getQuest = async (req, res, next) => {
    try {
        const quests = await Quest.find({})
        return res.json(quests)
    } catch (error) {
        next(error)
    }
}

export const getQuestById = async (req, res, next) => {
    try {
        const { id } = req.params
        const quest = await Quest.findById(id)
        if (!quest) {
            return next(createError(400, "Quest not found"))
        }
        return res.json(quest)
    } catch (error) {
        next(error)
    }
}


export const updateQuestById = async (req, res, next) => {
    try {
        const { id } = req.params

        const quest = await Quest.findById(id)
        if (!quest) {
            return next(createError(400, "Quest not found"))
        }

        if (req.user.role === "creator") {
            const currentOrganizeName = (await Admin.findById(req.user.id)).organizeName;
            const creatorOrganizeName = (await Admin.findById(quest.creatorId)).organizeName;
            if (currentOrganizeName !== creatorOrganizeName) {
                return next(createError(401, "You are not allowed to delete this quest"));
            }
        }

        const updatedQuest = await Quest.findByIdAndUpdate(id, req.body, { new: true })
        return res.json(updatedQuest)
    } catch (error) {
        next(error)
    }
}


export const deleteQuestById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const quest = await Quest.findById(id);

        if (!quest) {
            return next(createError(400, "Quest not found"));
        }

        if (req.user.role === "creator") {
            const currentOrganizeName = (await Admin.findById(req.user.id)).organizeName;
            const creatorOrganizeName = (await Admin.findById(quest.creatorId)).organizeName;
            if (currentOrganizeName !== creatorOrganizeName) {
                return next(createError(401, "You are not allowed to delete this quest"));
            }
        }

        await quest.deleteOne();
        return res.json({ msg: `quest: ${quest.questName} delete successfully` });
    } catch (error) {
        next(error);
    }
};


export const joinOrLeaveQuest = async (req, res, next) => {
    try {
        const { id } = req.params;
        let quest = await Quest.findById(id);
        if (!quest) return next(createError(400, "Quest not found"));


        // leave quest
        const alreadyJoin = quest.participant.find((user) => user.userId == req.user.id);
        if (alreadyJoin) {
            quest = await Quest.findByIdAndUpdate(
                id,
                { $pull: { participant: { userId: req.user.id } } },
                { new: true }
            )
            return res.json(quest);

        }

        // join quest
        quest = await Quest.findByIdAndUpdate(
            id,
            { $push: { participant: { userId: req.user.id, status: false } } },
            { new: true }
        );

        return res.json(quest);
    } catch (error) {
        next(error);
    }
};

export const getQuestParticipantsById = async (req, res, next) => {
    try {
        const { id } = req.params
        const quest = await Quest.findById(id).select('participant').populate({
            path: 'participant.userId',
            select: 'firstName lastName'
        })
        if (!quest) {
            return next(createError(400, "Quest not found"))
        }
        return res.json(quest)
    } catch (error) {
        next(error)
    }
}

export const questComplete = async (req, res, next) => {
    try {
        const { id } = req.params;
        const quest = await Quest.findById(id);
        if (!quest) { return next(createError(400, "Quest not found")); }

        // validate creator or admin
        if (req.user.role === "creator") {
            const currentOrganizeName = (await Admin.findById(req.user.id)).organizeName;
            const creatorOrganizeName = (await Admin.findById(quest.creatorId)).organizeName;
            if (currentOrganizeName !== creatorOrganizeName) {
                return next(createError(401, "You are not allowed to complete this quest"));
            }
        }

        // set quest complete
        quest.questStatus = true
        await quest.save()


        // ถ้าเควสมี ชั่วโมงกิจกรรม
        if (quest.activityHour) {
            const { category, hour } = quest.activityHour
            // กิจกรรมมหาวิทยาลัย
            if (category === "1") {
                for (const participant of quest.participant) {
                    const { userId } = participant
                    const user = await User.findById(userId)
                    user.activityTranscript.category.university.hour += hour
                    user.activityTranscript.category.university.count += 1
                    await user.save()
                }
            }
            // กิจกรรมเพื่อเสริมสร้างสมรรถนะ
            else if (category === "2.1" || category === "2.2" || category === "2.3" || category === "2.4") {
                let index;
                if (category === "2.1") index = "morality"
                else if (category === "2.2") index = "thingking"
                else if (category === "2.3") index = "relation"
                else if (category === "2.4") index = "health"

                for (const participant of quest.participant) {
                    // console.log(participant)
                    const { userId } = participant
                    const user = await User.findById(userId)
                    user.activityTranscript.category.empowerment.category[index].hour += hour
                    user.activityTranscript.category.empowerment.category[index].count += 1
                    await user.save()
                }
            }
            // กิจกรรมเพื่อเสริมสร้างสมรรถนะ
            else {
                for (const participant of quest.participant) {
                    const { userId } = participant
                    const user = await User.findById(userId)
                    user.activityTranscript.category.society.hour += hour
                    user.activityTranscript.category.society.count += 1
                    await user.save()

                }
            }
        }
        return res.json({ msg: `quest: ${quest.questName} complete successfully` });
    } catch (error) {
        next(error);
    }
}





