import { ValidationError } from 'common/errors';
import { FastifyReply, FastifyRequest, FastifySchema } from 'fastify';
import { BaseController } from 'infra/http/models';
import { ExamErrors } from 'modules/exam/errors';
import { UpdateExamUseCase } from './update-exam-use-case';

export class UpdateExamController extends BaseController {
  constructor(private readonly useCase: UpdateExamUseCase) {
    super();
  }

  public get schema(): FastifySchema {
    return {
      summary: 'Atualizar um exame',
      description: 'Atualizar um exame',
      tags: ['Exames'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          status: { type: 'string' },
        },
      },
    };
  }

  protected async implementation(
    request: FastifyRequest<{ Params: { id: string }; Body: any }>,
    reply: FastifyReply,
  ): Promise<void> {
    const result = await this.useCase.execute({
      ...request.params,
      ...request.body,
    });

    if (result.isSuccess()) {
      return this.noContent(reply);
    }

    const error = result.error;

    switch (error.constructor) {
      case ValidationError:
        return this.invalidRequest(reply, error);
      case ExamErrors.ExamNotFound:
        return this.notFound(reply, error);
      default:
        return this.unexpectedError(reply, error);
    }
  }
}
