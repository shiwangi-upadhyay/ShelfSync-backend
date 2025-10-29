import { Redis } from 'ioredis'

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT)
})

export const udpateUserSession = async (userId: string, sessionData: any) => {
    const sessionKey = `user:session:${userId}`;
    await redis.setex(sessionKey, 86400, JSON.stringify(sessionData))
}

export const removeUserSession = async (userId: string) => {
    const sessionKey = `user:session:${userId}`;
    await redis.del(sessionKey)
}

export const getUserSession = async (userId: string) => {
    const sessionKey = `user:session:${userId}`;
    const session = await redis.get(sessionKey);
    return session ? JSON.parse(session) : null
}