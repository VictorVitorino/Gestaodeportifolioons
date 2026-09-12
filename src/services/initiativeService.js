import { validateInitiativePayload } from '../rules/initiativeRules.js';

export class InitiativeService {
  constructor(repository, hierarchyValidator = null) {
    this.repository = repository;
    this.hierarchyValidator = hierarchyValidator;
  }

  async list(filters = {}) {
    return this.repository.findAll(filters);
  }

  async get(id) {
    const item = await this.repository.findById(id);
    if (!item) throw new Error('REFERENCE_NOT_FOUND');
    return item;
  }

  async create(payload) {
    validateInitiativePayload(payload);
    if (this.hierarchyValidator) {
      const ok = await this.hierarchyValidator(payload);
      if (!ok) throw new Error('HIERARCHY_MISMATCH');
    }
    return this.repository.create(payload);
  }

  async update(id, payload, expectedVersion) {
    validateInitiativePayload(payload);
    if (this.hierarchyValidator) {
      const ok = await this.hierarchyValidator(payload);
      if (!ok) throw new Error('HIERARCHY_MISMATCH');
    }
    return this.repository.update(id, payload, expectedVersion);
  }

  async archive(id) {
    return this.repository.archive(id);
  }
}
