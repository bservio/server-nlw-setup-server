import dayjs from "dayjs"
import { FastifyInstance } from "fastify"
import { z } from "zod"
import { prisma } from "./prisma"

export async function appRoutes(app: FastifyInstance) {
	//rota para criar novo hábito
	app.post('/habits', async (req, res) => {
		const createHabitBody = z.object({
			title: z.string(),
			weekDays: z.array(
				z.number().min(0).max(6)
			)
		})

		const { title, weekDays } = createHabitBody.parse(req.body)

		const today = dayjs().startOf('day').toDate()
		//usando a biblioteca dayjs para zerar a hora no formato de data no js

		await prisma.habit.create({
			data: {
				title,
				created_at: today,

				weekDays: {
					create: weekDays.map(weekDay => {
						return {
							week_day: weekDay,
						}
					})
				}
			}
		})
	})

	//rota para pegar os habitos possíveis e completados
	app.get('/day', async (req, res) => {
		const getDayParams = z.object({
			date: z.coerce.date()
		})

		const { date } = getDayParams.parse(req.query)

		const parsedDate = dayjs(date).startOf('day')
		const weekDay = parsedDate.get('day')

		console.log(date, weekDay)

		// todos habitos possíveis
		// habitos que já foram completados

		const possibleHabits = await prisma.habit.findMany({
			where: {
				created_at: {
					lte: date,
				},
				weekDays: {
					some: {
						week_day: weekDay
					}
				}
			}
		})

		const day = await prisma.day.findUnique({
			where: {
				date: parsedDate.toDate()
			},
			include: {
				dayHabits: true,
			}
		})

		const completedHabits = day?.dayHabits.map(dayHabit => {
			return dayHabit.habit_id
		})

		return {
			possibleHabits,
			completedHabits
		}
	})


}