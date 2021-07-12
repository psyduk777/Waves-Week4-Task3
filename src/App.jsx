/* eslint-disable no-undef */
import React, { useState, useEffect } from 'react';
import { hot } from 'react-hot-loader/root';

import { Flex, Modal } from './components/shared';
import { Coupons, Header } from './containers';
import { Dialog, Result, Form } from './components/modal';
import { useAppDialogs } from './components/service';
import { getCoupons } from './api';

const App = () => {
    const {
        selectedCoupon,
        dialog: [dialogOpened, onDialogOpen, onDialogClose],
        result: [resultOpened, onResultOpen, onResultClose],
        form: [formOpened, onFormOpen, onFormClose],
    } = useAppDialogs();

    const [coupons, updateCoupons] = useState([]);
    const [userCoupons, updateUserCoupons] = useState([]);
    const [filterActive, changeFilterState] = useState(false);

    useEffect(() => {
        async function fetchData() {
            const response = await getCoupons();
            updateCoupons(response);

            updateUserCoupons([response[0]]);
        }
        fetchData();
    }, []);
    const baseUri = 'https://nodes-testnet.wavesnodes.com';
    const contractAddress = '3N6SJ9kZxcbsY2VdDLB6sgXezSLuWmCfKkf';

    async function customerPurchase(coupon) {
        console.log(coupon);

        const data = {
            type: 16,
            data: {
                fee: {
                    tokens: '0.05',
                    assetId: null,
                },
                dApp: contractAddress,
                call: {
                    function: 'purchase',
                    args: [
                        {
                            type: 'string',
                            value: coupon.id.toString(),
                        }],
                },
                payment: [{ assetId: null, amount: 5 }],
            },
        };

        if (WavesKeeper) {
            console.log('Broadcasting transaction:');
            WavesKeeper.signAndPublishTransaction(data)
                .then((tx) => {
                    console.log(tx);
                });
        }
    }
    function supplierCreate() {
        console.log('Supplier create');

        const data = {
            type: 16,
            data: {
                fee: {
                    tokens: '0.05',
                    assetId: null,
                },
                dApp: contractAddress,
                call: {
                    function: 'registerSupplier',
                    args: [],
                },
                payment: [],
            },
        };

        if (WavesKeeper) {
            console.log('Broadcasting transaction:');
            WavesKeeper.signAndPublishTransaction(data)
                .then((tx) => {
                    console.log(tx);
                });
        }
    }

    function addItem(coupon) {
        console.log('Add New Item');
        console.log(coupon);

        const data = {
            type: 16,
            data: {
                fee: {
                    tokens: '0.05',
                    assetId: null,
                },
                dApp: contractAddress,
                call: {
                    function: 'addItem',
                    args: [
                        {
                            type: 'string',
                            value: coupon.title.toString(),
                        },
                        {
                            type: 'integer',
                            value: coupon.newPrice,
                        },
                        {
                            type: 'string',
                            value: JSON.stringify(coupon),
                        },
                    ],
                },
                payment: [],
            },
        };

        if (WavesKeeper) {
            console.log('Broadcasting transaction:');

            WavesKeeper.signAndPublishTransaction(data)
                .then((tx) => {
                    console.log(tx);
                });
        }
    }

    async function digestMessage(message) {
        const msgUint8 = new TextEncoder().encode(message);                           // encode as (utf-8) Uint8Array
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);           // hash the message
        const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
        return hashHex;
    }

    async function commitVote(coupon) {

        const salt = prompt('Enter Salt', 'salt1');

        const voteTypes = {
            delisted: 'delisted',
            featured: 'featured',
        };
        
        const hex = await digestMessage(voteTypes.delisted + salt.toString());

        const data = {
            type: 16,
            data: {
                fee: {
                    tokens: '0.05',
                    assetId: null,
                },
                dApp: contractAddress,
                call: {
                    function: 'voteCommit',
                    args: [
                        {
                            type: 'string',
                            value: coupon.title,
                        },
                        {
                            type: 'string',
                            value: hex,
                        },

                    ],
                },
                payment: [],
            },
        };

        if (WavesKeeper) {
            console.log('Broadcasting transaction:');

            WavesKeeper.signAndPublishTransaction(data)
                .then((tx) => {
                    console.log(tx);
                });
        }
    }

    return (
        <>
            <Header
                onCreateCoupon={onFormOpen}
                filterActive={filterActive}
                onChangeFilterState={changeFilterState}
                onCreateSupplier={supplierCreate}
            />
            <Flex
                justifyContent="center"
                p={{
                    0: '10px',
                    md: '20px',
                }}
                flexWrap="wrap"
            >
                <Coupons
                    onDialogOpen={onDialogOpen}
                    coupons={filterActive ? userCoupons : coupons}
                />
            </Flex>
            <Modal open={dialogOpened} onClose={onDialogClose}>
                <Dialog
                    coupon={selectedCoupon}
                    onClose={onDialogClose}
                    onVote={() => {
                        commitVote(selectedCoupon);
                    }}
                    onSubmit={() => {
                        onDialogClose();
                        onResultOpen();
                        customerPurchase(selectedCoupon);
                    }}
                />
            </Modal>
            <Modal open={resultOpened} onClose={onResultClose}>
                <Result onClose={onResultClose} />
            </Modal>
            <Modal
                open={formOpened}
                onClose={onFormClose}
                width={{
                    0: '100%',
                    lg: 'initial',
                }}
                mx="10px"
            >
                <Form
                    onClose={onFormClose}
                    onSubmit={(data) => {
                        const fn = filterActive ? updateUserCoupons : updateCoupons;
                        const entity = filterActive ? userCoupons : coupons;
                        fn([...entity, { ...data, id: new Date().valueOf() }]);
                        onFormClose();
                        onResultOpen();
                        addItem(data);
                    }}
                />
            </Modal>
        </>
    );
};

export default hot(App);
