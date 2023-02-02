/**
 * @module initDatabase Controller
 * @description Contains middleware that creates and runs the local database
 */

import db from '../models/psqlQuery';
import { type Request, type Response, type NextFunction } from 'express';
import { type InitController, type ServerError } from '../../types';
import path from 'path';
import { exec } from 'child_process';

const initController: InitController = {
  initDatabase: (req: Request, res: Response, next: NextFunction) => {
    const directory =
      process.env.NODE_ENV === 'development'
        ? path.resolve(__dirname, '../database')
        : path.join(path.dirname(__dirname), 'database');

    exec(
      `cd ${directory} && docker compose up --no-recreate --wait -d`,
      (error, stdout, stderr) => {
        res.locals.error = error;
        res.locals.stderr = stderr;
        res.locals.stdout = stdout;
        next();
      }
    );
  },

  timeZone: (req: Request, res: Response, next: NextFunction) => {
    const parameter = [req.body.timezone.toString()];
    console.log(parameter);
    db.query(`ALTER DATABASE postgres SET timezone TO ${parameter}`)
      .then((data: any) => {
        next();
      })
      .catch((err: ServerError) => {
        console.log(err);
        if (err) { next(err); }
      });
  },

  gitUrl: (req: Request, res: Response, next: NextFunction) => {
    const parameter = [req.body.githubUrl];
    db.query('SELECT github_url FROM containers where name = $1', parameter)
      .then((data: any) => {
        res.locals.url = data;
        next();
      })
      .catch((err: ServerError) => {
        console.log(err);
        if (err) { next(err); }
      });
  },

  // inserting the metrics pulled from the running containers and stopped containers from Docker into the Database
  addMetrics: (req: Request, res: Response, next: NextFunction) => {
    const containers = Object.keys(req.body.containers);
    const queryString = 'INSERT INTO metrics (container_id, container_name, cpu_pct, memory_pct, memory_usage, net_io, block_io, pid) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
    containers.forEach((container) => {
      const { ID, names, cpu, mem, memuse, net, block, pid } = req.body.containers[container];
      const parameters = [ID, names, cpu, mem, memuse, net, block, pid];
      db.query(queryString, parameters)
        .then(() => {
        })
        .catch((err: ServerError) => {
          console.log(err);
          if (err) { next(err); }
        });
    });
    next();
  },

  getMetrics: async (req: Request, res: Response, next: NextFunction) => {
    const timePeriod = req.body.time;
    let queryString = 'SELECT * FROM metrics WHERE (container_name = $1 ';
    const queryStringEnd = `AND created_at >= now() - interval '${timePeriod} hour' ORDER BY "created_at" ASC`;
    const containerList = req.body.containers;
    let count = 1;
    // if only one checkbox is clicked, this will run
    if (containerList.length === 1) {
      queryString += ')' + queryStringEnd;
      await db.query(queryString, containerList)
        .then((data: any) => {
          res.locals.metrics = data;
          next();
        });
    }
    // if there are more than one containers selected, this will activate
    else {
      containerList.slice(1).forEach((container: any) => {
        let additionalParameter = `OR container_name = $${count + 1} `;
        count++;
        if (count >= containerList.length) additionalParameter += ')';
        queryString += additionalParameter;
      });
      queryString += queryStringEnd;
      await db.query(queryString, containerList)
        .then((data: any) => {
          res.locals.metrics = data;
          next();
        });
    }
  }
};

export default initController;