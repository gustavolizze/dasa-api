import { Lab } from 'modules/lab/domain';
import { LabRepository } from '../lab-repository';
import { LabMap } from 'modules/lab/mappers';
import {
  AssociationSchema,
  LabSchema,
  ExamCollection,
  LabCollection,
} from 'infra/database/mongoose/schemas';
import { ReturnModelType } from '@typegoose/typegoose';
import { LabDto } from 'modules/lab/dto';
import { EntityStatus } from 'common/domain';

export class LabMongoRepo implements LabRepository {
  constructor(
    private readonly labModel: ReturnModelType<typeof LabSchema>,
    private readonly associationModel: ReturnModelType<
      typeof AssociationSchema
    >,
  ) {}

  findActiveLabsByExamName(examName: string): Promise<LabSchema[]> {
    return this.associationModel
      .aggregate()
      .lookup({
        from: ExamCollection,
        localField: 'exam',
        foreignField: '_id',
        as: 'examObj',
      })
      .lookup({
        from: LabCollection,
        localField: 'lab',
        foreignField: '_id',
        as: 'labObj',
      })
      .unwind('labObj')
      .match({ 'examObj.name': new RegExp(examName, 'i') })
      .exec()
      .then((result: any) =>
        Array.isArray(result)
          ? result.map((item) => item.labObj as LabSchema)
          : [],
      );
  }

  findById(id: string): Promise<Lab> {
    return this.labModel
      .findById(id)
      .lean()
      .exec()
      .then(LabMap.fromPersistToDomain);
  }

  async update(lab: Lab): Promise<void> {
    const { _id, ...update } = LabMap.fromDomainToPersist(lab);

    await this.labModel.findByIdAndUpdate(_id, update).lean().exec();
  }

  async delete(id: string): Promise<void> {
    await this.labModel
      .findByIdAndUpdate(id, {
        status: EntityStatus.inactive().value,
      })
      .lean()
      .exec();
  }

  async create(input?: Lab): Promise<void> {
    const toPersist = LabMap.fromDomainToPersist(input);
    await new this.labModel(toPersist).save();
  }

  existsByName(labName: string): Promise<boolean> {
    return this.labModel.exists({
      name: new RegExp(labName, 'i'),
    });
  }

  existsById(id: string): Promise<boolean> {
    return this.labModel.exists({
      _id: id,
    });
  }

  findActiveLabs(): Promise<LabDto[]> {
    const status = EntityStatus.active().value;

    return this.labModel
      .find({
        status,
      })
      .lean()
      .exec()
      .then((result) =>
        Array.isArray(result) ? result.map(LabMap.fromPersistToDto) : [],
      );
  }
}
