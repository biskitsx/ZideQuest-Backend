import createApp from "../app"
import * as pactum from 'pactum'
import { connectDb } from "../util/connectDb"
import dotenv from 'dotenv'
import { logger } from "../util/logger"
import { adminInfo, locationInfo, quest1Info, quest2Info, quest3Info, userInfo, userInfo2 } from "./data"


describe('Test', () => {
    let server;
    beforeAll(async () => {
        dotenv.config();
        const app = createApp()

        // define port and start server
        const PORT = process.env.PORT || 3000;
        server = app.listen(PORT, async () => {
            logger.info(`server start at http://localhost:${PORT}`)
            await connectDb()
        });
        pactum.request.setBaseUrl(`http://localhost:${PORT}/api/v1`);
    })

    afterAll(async () => {
        await server.close()
    })


    describe("User", () => {
        it('should get zero user', async () => {
            return await pactum
                .spec()
                .get('/users')
                .expectStatus(200)
                .expectBody([])
        })
        it('should create a User ', async () => {
            await pactum
                .spec()
                .post('/users')
                .withBody(userInfo)
                .expectStatus(200)
                .expectJsonMatch('firstName', userInfo.firstName)
        })
        it('should create a User2 ', async () => {
            await pactum
                .spec()
                .post('/users')
                .withBody(userInfo2)
                .expectStatus(200)
                .expectJsonMatch('firstName', userInfo2.firstName)
        })
        it('should get single user', async () => {
            await pactum
                .spec()
                .get('/users')
                .expectStatus(200)
                .expectBodyContains(userInfo.firstName)
        })

    })

    describe("Admin", () => {
        it('should create a Admin ', async () => {
            await pactum
                .spec()
                .post('/admins')
                .withBody(adminInfo)
                .expectStatus(200)
        })
    })


    describe('Auth', () => {
        it('should throw if username not found', async () => {
            return await pactum
                .spec()
                .post('/auth/login')
                .withBody({
                    username: "kit",
                    password: "123",
                })
                .expectStatus(404);
        });
        it('should login (admin)', async () => {
            return await pactum
                .spec()
                .post('/auth/login')
                .withBody({
                    username: "zidequest",
                    password: "123",
                })
                .expectStatus(200)
                .stores('adminAt', 'token')
        });
        it('should login (user)', async () => {
            await pactum
                .spec()
                .post('/auth/login')
                .withBody({
                    username: "jittat",
                    password: "123123",
                })
                .expectStatus(200)
                .stores('userAt', 'token')
                .stores('userId', 'user._id')
        });
        it('should login (user2)', async () => {
            await pactum
                .spec()
                .post('/auth/login')
                .withBody({
                    username: "ratchanon",
                    password: "123123",
                })
                .expectStatus(200)
                .stores('userAt2', 'token')
                .stores('userId2', 'user._id')
        });
    })

    describe('Location', () => {
        it('should get zero location', async () => {
            return await pactum
                .spec()
                .get('/locations')
                .expectStatus(200)
                .expectBody([])
        })
        it('create location without authorize', async () => {
            await pactum
                .spec()
                .post('/locations')
                .withBody(locationInfo)
                .expectStatus(401)
        })
        it('create location', async () => {
            await pactum
                .spec()
                .post('/locations')
                .withHeaders({
                    Authorization: 'Bearer $S{adminAt}',
                })
                .withBody(locationInfo)
                .stores('locationId', '_id')
                .expectJsonMatch('locationName', locationInfo.locationName)
                .expectStatus(200)
        })
        it('shoud get 1 location', async () => {
            await pactum
                .spec()
                .get('/locations')
                .expectStatus(200)
                .expectBodyContains('$S{locationId}')
        })
    })

    describe('Quest', () => {
        it('should get zero quest', async () => {
            await pactum
                .spec()
                .get('/quests')
                .expectStatus(200)
                .expectBody([])
        })
        it('create quest without authorize', async () => {
            await pactum
                .spec()
                .post('/quests/locations/$S{locationId}')
                .withBody(quest1Info)
                .expectStatus(401)
        })
        it('create quest', async () => {
            await pactum
                .spec()
                .post('/quests/locations/$S{locationId}')
                .withHeaders({ Authorization: 'Bearer $S{adminAt}' })
                .withBody(quest1Info)
                .stores('quest1Id', '_id')
                .expectJsonMatch('questName', quest1Info.questName)
                .expectStatus(200)
        })
        it('should get single quest', async () => {
            await pactum
                .spec()
                .get('/quests')
                .expectStatus(200)
                .expectBodyContains('$S{quest1Id}')
        })

        it('should ', async () => {
            return await pactum
                .spec()
                .get('/quests')
                .expectStatus(200)
                .expectBodyContains('$S{quest1Id}')
        })
        describe("Get Creator Quest", () => {
            it('should error creator quest', async () => {
                return await pactum
                    .spec()
                    .get('/quests/creator-all')
                    .expectStatus(401)

            })
            it('should get creator quest', async () => {
                const { body } = await pactum
                    .spec()
                    .get('/quests/creator-all')
                    .withHeaders({ Authorization: 'Bearer $S{adminAt}' })
                    .expectStatus(200)
                    .expectBodyContains('$S{quest1Id}')
            })


            it('create quest 2', async () => {
                await pactum
                    .spec()
                    .post('/quests/locations/$S{locationId}')
                    .withHeaders({ Authorization: 'Bearer $S{adminAt}' })
                    .withBody(quest2Info)
                    .stores('quest2Id', '_id')
                    .expectJsonMatch('questName', quest2Info.questName)
                    .expectStatus(200)
            })
            it('create quest 3', async () => {
                await pactum
                    .spec()
                    .post('/quests/locations/$S{locationId}')
                    .withHeaders({ Authorization: 'Bearer $S{adminAt}' })
                    .withBody(quest3Info)
                    .stores('quest3Id', '_id')
                    .expectJsonMatch('questName', quest3Info.questName)
                    .expectStatus(200)
            })

            it('should get creator all quest ', async () => {
                const { body } = await pactum
                    .spec()
                    .get('/quests/creator-all')
                    .withHeaders({ Authorization: 'Bearer $S{adminAt}' })
                    .expectStatus(200)
                    .expectBodyContains('$S{quest1Id}')
                    .expectBodyContains('$S{quest2Id}')
                    .expectBodyContains('$S{quest3Id}')
            })
            it('should complete quest', async () => {
                await pactum
                    .spec()
                    .withHeaders({ Authorization: 'Bearer $S{adminAt}' })
                    .expectStatus(200)
                    .patch('/quests/$S{quest2Id}/complete')
            })

            it('should get creator all quest ', async () => {
                const { body } = await pactum
                    .spec()
                    .get('/quests/creator-all')
                    .withHeaders({ Authorization: 'Bearer $S{adminAt}' })
                    .expectStatus(200)
                    .expectBodyContains('$S{quest1Id}')
                    .expectBodyContains('$S{quest2Id}')
                    .expectBodyContains('$S{quest3Id}')
                expect(body.length).toBe(3)

            })

            it('should get creator uncomplete quest ', async () => {
                const { body } = await pactum
                    .spec()
                    .get('/quests/creator-uncomplete')
                    .withHeaders({ Authorization: 'Bearer $S{adminAt}' })
                    .expectStatus(200)
                    .expectBodyContains('$S{quest1Id}')
                    .expectBodyContains('$S{quest3Id}')
                expect(body.length).toBe(2)
            })
        })

        describe('Join Quest', () => {
            it('user join quest', async () => {
                const { body } = await pactum
                    .spec()
                    .patch('/quests/$S{quest1Id}/join-leave')
                    .withHeaders({ Authorization: 'Bearer $S{userAt}' })
                    .expectStatus(200)
            })
            it('user2 join quest', async () => {
                const { body } = await pactum
                    .spec()
                    .patch('/quests/$S{quest1Id}/join-leave')
                    .withHeaders({ Authorization: 'Bearer $S{userAt2}' })
                    .expectStatus(200)
            })
            it('quest should has user ', async () => {
                const { body } = await pactum
                    .spec()
                    .get('/quests/$S{quest1Id}/participants')
                    .expectStatus(200)
                    .expectBodyContains('$S{userId}')
            })
            it('status of user should be false', async () => {
                await pactum
                    .spec()
                    .get('/quests/$S{quest1Id}/participants')
                    .expectStatus(200)
                    .expectBodyContains(false)
            })
            it('creator shoud check user ', async () => {
                await pactum
                    .spec()
                    .patch('/quests/$S{quest1Id}/check-user')
                    .withHeaders({ Authorization: 'Bearer $S{adminAt}' })
                    .withBody({
                        users: ['$S{userId}']
                    })
                    .expectStatus(200)
            })
            it('status of user should be true', async () => {
                await pactum
                    .spec()
                    .get('/quests/$S{quest1Id}/participants')
                    .expectStatus(200)
                    .expectBodyContains(true)
            })
            it('creator shoud un-check user ', async () => {
                await pactum
                    .spec()
                    .patch('/quests/$S{quest1Id}/uncheck-user')
                    .withHeaders({ Authorization: 'Bearer $S{adminAt}' })
                    .withBody({
                        users: ['$S{userId}']
                    })
                    .expectStatus(200)
            })
            it('status of user should be false', async () => {
                await pactum
                    .spec()
                    .get('/quests/$S{quest1Id}/participants')
                    .expectStatus(200)
                    .expectBodyContains(false)
            })
            it('quest should haveee user ', async () => {
                const { body } = await pactum
                    .spec()
                    .get('/quests/$S{quest1Id}/participants')
                    .expectStatus(200)
                // .expectJsonMatch('participant', [])
            })
            it('quest should has 2 participant ', async () => {
                await pactum
                    .spec()
                    .get('/quests/$S{quest1Id}/find')
                    .withHeaders({ Authorization: 'Bearer $S{adminAt}' })
                    .expectStatus(200)
                    .expectJsonMatch('countParticipant', 2)
            })
            it('creator remove user from quest', async () => {
                await pactum
                    .spec()
                    .patch('/quests/$S{quest1Id}/remove-user')
                    .withBody({
                        users: [
                            '$S{userId}',
                            '$S{userId2}'
                        ]
                    })
                    .withHeaders({ Authorization: 'Bearer $S{adminAt}' })
                    .expectStatus(200)
            })
            it('quest should has no user ', async () => {
                const { body } = await pactum
                    .spec()
                    .get('/quests/$S{quest1Id}/participants')
                    .expectStatus(200)
                    .expectJsonMatch('participant', [])
            })
            it('quest should ... ', async () => {
                const { body } = await pactum
                    .spec()
                    .get('/quests/$S{quest1Id}/find')
                    .withHeaders({ Authorization: 'Bearer $S{adminAt}' })
                    .expectStatus(200)
                    .expectJsonMatch('countParticipant', 0)
            })



            it('user shoud has no quest ', async () => {
                await pactum
                    .spec()
                    .get('/users/info')
                    .withHeaders({ Authorization: 'Bearer $S{userAt}' })
                    .expectStatus(200)
                    .expectJsonMatch('joinedQuest', [])
            })
        })
    })
    describe("Location", () => {
        it('should get is CheckIn and isJoin  ', async () => {
            await pactum
                .spec()
                .get('/locations/$S{locationId}')
                .withHeaders({ Authorization: 'Bearer $S{userAt}' })
                .expectStatus(200)
        })
        it('should not get isCHeckIn and isJoin  ', async () => {
            await pactum
                .spec()
                .get('/locations/$S{locationId}')
                // .withHeaders({ Authorization: 'Bearer $S{userAt}' })
                .expectStatus(200)
        })
    })
    describe("Quest Cancle", () => {
        it('user join quest', async () => {
            const { body } = await pactum
                .spec()
                .patch('/quests/$S{quest3Id}/join-leave')
                .withHeaders({ Authorization: 'Bearer $S{userAt}' })
                .expectStatus(200)
        })
        it('should get user info with notification', async () => {
            await pactum
                .spec()
                .get('/users/info')
                .withBearerToken('$S{userAt}')
                .expectStatus(200)
                .expectJsonMatch('notifications', [])
        })
        it('should cancle quest', async () => {
            await pactum
                .spec()
                .patch('/quests/$S{quest3Id}/cancel')
                .withHeaders({
                    Authorization: 'Bearer $S{adminAt}',
                })
                .withBody({
                    message: "unavailable"
                })
                .expectStatus(200)
                .stores('notification1Id', '_id')
        })
        it('should get user info with notification', async () => {
            await pactum
                .spec()
                .get('/users/info')
                .withBearerToken('$S{userAt}')
                .expectStatus(200)
                .expectBodyContains('$S{notification1Id}')
        })
    })
    describe("Tag", () => {
        it('should create tag', async () => {
            await pactum
                .spec()
                .post('/tags')
                .withHeaders({
                    Authorization: 'Bearer $S{adminAt}',
                })
                .withBody({
                    tagName: "tag1"
                })
                .expectStatus(200)
        })
    })
    describe('Location', () => {
        it('shoud get this location ', async () => {
            const { body } = await pactum
                .spec()
                .get('/locations/$S{locationId}')
                .expectStatus(200)
                .expectBodyContains('$S{locationId}')
        })
        it('shoud get this location with userid ', async () => {
            const { body } = await pactum
                .spec()
                .get('/locations/$S{locationId}')
                .withHeaders({
                    Authorization: 'Bearer $S{userAt}',
                })
                .expectStatus(200)
                .expectBodyContains('$S{locationId}')
        })
    })
})

