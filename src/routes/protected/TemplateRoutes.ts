import { Request, Response } from 'express';
import TemplateOperations from '../../db/TemplateOperations';
import AuthService from '../../middleware/AuthService';
import BaseRoute from '../BaseRoute';

class TemplateRoutes extends BaseRoute {
	private static instance: TemplateRoutes;
	private tempOps = TemplateOperations.getInstance();
	public path = '/templates';

	private constructor() {
		super();
		this.initialiseRoutes();
	}

	public static getInstance(): TemplateRoutes {
		if (!TemplateRoutes.instance) {
			TemplateRoutes.instance = new TemplateRoutes();
		}

		return TemplateRoutes.instance;
	}

	public configureRoutes(): void {
		this.router.use(AuthService.verifyToken); // Applies middleware to all routes
		this.router.get('/', this.getAllTemplates.bind(this));
		this.router.get('/:templateId', this.getSingleTemplate.bind(this));
	}

	private async getAllTemplates(req: Request, res: Response) {
		try {
			const userId = req.user?.id;
			if (!userId) {
				return res.status(403).json({ error: "Can't get user ID from request" });
			}

			const defaultTemplates = await this.tempOps.getDefaultTemplates();
			const userTemplates = await this.tempOps.getUserTemplates(userId);

			res.status(200).json({
				defaultTemplates: defaultTemplates,
				userTemplates: userTemplates
			});
		} catch (err) {
			console.error('Getting templates error:', err);
			res.status(500).json({ error: 'Failed to get templates' });
		}
	}

	private async getSingleTemplate(req: Request, res: Response) {
		const { templateId } = req.params;

		try {
			if (!templateId) {
				return res.status(403).json({ error: "Can't get template ID from request" });
			}

			const templateWithExercises = await this.tempOps.getSingleTemplate(templateId);
			if (!templateWithExercises) {
				return res.status(404).json({ error: "Can't find template" });
			}

			res.status(200).json({ template: templateWithExercises });
		} catch (err) {
			console.error('Getting templates error:', err);
			res.status(500).json({ error: 'Failed to get templates' });
		}
	}
}

export default TemplateRoutes;
