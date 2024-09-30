// Copyright (C) 2023-2024 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useState } from 'react';
import { useHistory } from 'react-router';
import { DownloadOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { ColumnFilterItem, Key } from 'antd/lib/table/interface';
import Table from 'antd/lib/table';
import Button from 'antd/lib/button';
import Text from 'antd/lib/typography/Text';

import {
    Task, Job, JobType, getCore, ConsensusReport,
} from 'cvat-core-wrapper';
import CVATTooltip from 'components/common/cvat-tooltip';
import Tag from 'antd/lib/tag';
import { toRepresentation, consensusColorGenerator } from 'utils/consensus';
import { sorter } from 'utils/quality';
import { ConflictsTooltip } from './consensus-conflicts';

interface Props {
    task: Task;
    jobsReports: ConsensusReport[];
}

function JobListComponent(props: Props): JSX.Element {
    const { task: taskInstance, jobsReports: jobsReportsArray } = props;
    const jobsReports: Record<number, ConsensusReport> = jobsReportsArray.reduce(
        (acc, report) => {
            if (!acc[report.jobID]) {
                acc[report.jobID] = report;
            }
            return acc;
        },
        {},
    );
    const history = useHistory();
    const { id: taskId, jobs } = taskInstance;
    const [renderedJobs] = useState<Job[]>(jobs.filter((job: Job) => job.type === JobType.ANNOTATION));

    function collectUsers(path: string): ColumnFilterItem[] {
        return Array.from<string | null>(
            new Set(
                Object.values(jobsReports).map((report: ConsensusReport) => {
                    if (report[path] === null) {
                        return null;
                    }

                    return report[path].username;
                }),
            ),
        ).map((value: string | null) => ({ text: value ?? 'Is Empty', value: value ?? false }));
    }

    const columns = [
        {
            title: 'Job',
            dataIndex: 'job',
            key: 'job',
            sorter: sorter('key'),
            render: (id: number): JSX.Element => (
                <div>
                    <Button
                        className='cvat-open-job-button'
                        type='link'
                        onClick={(e: React.MouseEvent): void => {
                            e.preventDefault();
                            history.push(`/tasks/${taskId}/jobs/${id}`);
                        }}
                        href={`/tasks/${taskId}/jobs/${id}`}
                    >
                        {`Job #${id}`}
                    </Button>
                </div>
            ),
        },
        {
            title: 'Stage',
            dataIndex: 'stage',
            key: 'stage',
            className: 'cvat-job-item-stage',
            render: (jobInstance: any): JSX.Element => {
                const { stage } = jobInstance;

                return (
                    <div>
                        <Text>{stage}</Text>
                    </div>
                );
            },
            sorter: sorter('stage.stage'),
            filters: [
                { text: 'annotation', value: 'annotation' },
                { text: 'validation', value: 'validation' },
                { text: 'acceptance', value: 'acceptance' },
            ],
            onFilter: (value: boolean | Key, record: any) => record.stage.stage === value,
        },
        {
            title: 'Assignee',
            dataIndex: 'assignee',
            key: 'assignee',
            className: 'cvat-job-item-assignee',
            render: (report: ConsensusReport): JSX.Element => <Text>{report?.assignee?.username}</Text>,
            sorter: sorter('assignee.username'),
            filters: collectUsers('assignee'),
            onFilter: (value: boolean | Key, record: any) => (record.assignee.assignee?.username || false) === value,
        },
        {
            title: 'Conflicts',
            dataIndex: 'conflicts',
            key: 'conflicts',
            className: 'cvat-job-item-conflicts',
            sorter: sorter('conflicts.summary.conflictCount'),
            render: (report: ConsensusReport): JSX.Element => {
                const conflictCount = report?.summary?.conflictCount;
                return (
                    <div className='cvat-job-list-item-conflicts'>
                        <Text>{conflictCount || 0}</Text>
                        <CVATTooltip
                            title={<ConflictsTooltip reportSummary={report?.summary} />}
                            className='cvat-analytics-tooltip'
                            overlayStyle={{ maxWidth: '500px' }}
                        >
                            <QuestionCircleOutlined style={{ opacity: 0.5 }} />
                        </CVATTooltip>
                    </div>
                );
            },
        },
        {
            title: 'Score',
            dataIndex: 'quality',
            key: 'quality',
            align: 'center' as const,
            className: 'cvat-job-item-quality',
            sorter: sorter('quality.consensus_score'),
            render: (report?: ConsensusReport): JSX.Element => {
                const meanConsensusScore = report?.consensus_score;
                const consensusScoreRepresentation = toRepresentation(meanConsensusScore);
                return consensusScoreRepresentation.includes('N/A') ? (
                    <Text
                        style={{
                            color: consensusColorGenerator(0.9)(meanConsensusScore),
                        }}
                    >
                        N/A
                    </Text>
                ) : (
                    <Tag color={consensusColorGenerator(0.9)(meanConsensusScore)}>{consensusScoreRepresentation}</Tag>
                );
            },
        },
        {
            title: 'Download',
            dataIndex: 'download',
            key: 'download',
            className: 'cvat-job-item-quality-report-download',
            align: 'center' as const,
            render: (job: Job): JSX.Element => {
                const report = jobsReports[job.id];
                const reportID = report?.id;
                return reportID ? (
                    <a
                        href={`${getCore().config.backendAPI}/consensus/reports/${reportID}/data`}
                        download={`consensus-report-job_${job.id}-${reportID}.json`}
                    >
                        <DownloadOutlined />
                    </a>
                ) : (
                    <DownloadOutlined />
                );
            },
        },
    ];
    const data = renderedJobs.reduce((acc: any[], job: any) => {
        const report = jobsReports[job.id];

        acc.push({
            key: job.id,
            job: job.id,
            download: job,
            stage: job,
            assignee: report,
            quality: report,
            conflicts: report,
        });

        return acc;
    }, []);

    return (
        <div className='cvat-task-job-list'>
            <Table
                className='cvat-task-jobs-table'
                rowClassName={() => 'cvat-task-jobs-table-row'}
                columns={columns}
                dataSource={data}
                size='small'
            />
        </div>
    );
}

export default React.memo(JobListComponent);
