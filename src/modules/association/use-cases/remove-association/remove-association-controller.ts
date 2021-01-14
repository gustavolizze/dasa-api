import { ValidationError } from 'common/errors';
import { FastifyRequest, FastifyReply } from 'fastify';
import { BaseController } from 'infra/http/models';
import { AssociationErrors } from 'modules/association/errors';
import { RemoveAssociationUseCase } from './remove-association-use-case';

export class RemoveAssociationController extends BaseController {
  constructor(private readonly useCase: RemoveAssociationUseCase) {
    super();
  }

  protected async implementation(
    request: FastifyRequest<{ Params: any }>,
    reply: FastifyReply,
  ): Promise<void> {
    const result = await this.useCase.execute(request.params);

    if (result.isSuccess()) {
      return this.noContent(reply);
    }

    const error = result.error;

    switch (error.constructor) {
      case ValidationError:
        return this.invalidRequest(reply, error);
      case AssociationErrors.AssociationNotFound:
        return this.notFound(reply, error);
      default:
        return this.unexpectedError(reply, error);
    }
  }
}
