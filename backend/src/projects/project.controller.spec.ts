import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

describe('ProjectController', () => {
  let controller: ProjectController;
  let serviceMock: { getProjects: jest.Mock; getProjectById: jest.Mock };

  beforeEach(async () => {
    serviceMock = {
      getProjects: jest.fn().mockResolvedValue([]),
      getProjectById: jest.fn().mockResolvedValue({ id: 'proj-1', title: 'Story #1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [{ provide: ProjectService, useValue: serviceMock }],
    }).compile();

    controller = module.get<ProjectController>(ProjectController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProjects', () => {
    it('delegates to ProjectService with userId from JWT', async () => {
      const result = await controller.getProjects({ sub: 'user-1' });
      expect(result).toEqual([]);
      expect(serviceMock.getProjects).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getProjectById', () => {
    it('delegates to ProjectService with id and userId from JWT', async () => {
      const result = await controller.getProjectById({ sub: 'user-1' }, 'proj-1');
      expect(result).toMatchObject({ id: 'proj-1' });
      expect(serviceMock.getProjectById).toHaveBeenCalledWith('proj-1', 'user-1');
    });
  });
});
