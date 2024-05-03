import React, { useState } from 'react';
import { useAppSelector } from '../../reducers/hooks'
import { useAppDispatch} from '../../reducers/hooks';
import styles from './config.module.scss'
import Client from '../../models/Client';
import { setScrapeConfigs } from '../../reducers/configurationReducer';

const JobConfigs = ({ index }: any): React.JSX.Element => {
  const dispatch = useAppDispatch();

  // grab specific scrape config job
  const global = useAppSelector(state => state.configuration.global);
  const scrapeConfigs = useAppSelector(state => state.configuration.scrapeConfigs);
  const [isEdit, setIsEdit] = useState(false);
  const [localSettings, setLocalSettings]: any = useState({})
  const job = scrapeConfigs[index];

  // strings to display
  const jobName = job.job_name;
  const scrapeInterval = job.scrape_interval;
  let targets = '';
  job.static_configs[0].targets.forEach(target => {
    targets += (target + ' ')
  })

  const handleEdit = (e) => {
    e.preventDefault();
    setLocalSettings(job);
    setIsEdit(true);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    // deep clone of current scrape configs
    const newScrapeConfigs = JSON.parse(JSON.stringify(scrapeConfigs));
    // modify our current index config / job with our localSettings
    newScrapeConfigs[index] = localSettings;

    await Client.ConfigService.updateYaml(global, newScrapeConfigs);
    dispatch(setScrapeConfigs(newScrapeConfigs));

    setIsEdit(false);
  }

  const handleDelete = async (e) => {
    e.preventDefault();

    // deep clone of current scrape configs
    const newScrapeConfigs: [] = JSON.parse(JSON.stringify(scrapeConfigs));
    // modify our current index config / job with our localSettings
    newScrapeConfigs.splice(index, 1);

    await Client.ConfigService.updateYaml(global, newScrapeConfigs);
    dispatch(setScrapeConfigs(newScrapeConfigs));

    setIsEdit(false);
  }

  console.log('localSettings', localSettings);

  return (
    <div className={styles.containerCard2}>
      <button className={styles.Sub1} type="submit" name="Submit" onClick={handleDelete}>
        Delete
      </button>
      <div>
        <b>Job Name: </b> <span>{jobName}</span>
        <br />
        <b>Scrape Interval: </b> <span>{scrapeInterval}</span>
        <br />
        <b>Targets: </b>
        {isEdit ? (
          <input
            style={{ color: "black", width: "600px" }}
            value={localSettings.static_configs[0].targets}
            type="text"
            onChange={(e) =>
              setLocalSettings({
                ...localSettings,
                static_configs: [{ targets: e.target.value.split(',') }],
              })
            }
          />
        ) : (
          <span>{targets}</span>
        )}
      </div>

   

      {isEdit ? (
        <input
          className={styles.btn}
          type="submit"
          value="Submit"
          onClick={handleSubmit}
        />
      ) : (
        <input
          className={styles.btn}
          type="button"
          value="Edit"
          onClick={handleEdit}
        />
      )}
    </div>
  );
}



export default JobConfigs;