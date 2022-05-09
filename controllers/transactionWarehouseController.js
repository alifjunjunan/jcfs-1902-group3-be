const { db, dbQuery } = require('../supports/database')
const axios = require('axios')
const { uploader } = require('../supports/uploader')
const fs = require('fs')

axios.defaults.baseURL = 'https://api.rajaongkir.com/starter'
axios.defaults.headers.common['key'] = 'e16ebfa0c9d8e75186df8a9122d40fa4'
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'
//idcart, iduser, idpero
module.exports = {
    // requestStock: (req, res) => {
    //     try {
    //         let {idwarehouse, idproduct, invoice, total_harga, ongkir, catatan, added_date, updated_date} = req.body
    //         let requestStock = `insert into transaksi_warehouse (iduser, idwarehouse, idproduct, idstatus, invoice, total_harga, ongkir, catatan, added_date, updated_date) values (
    //             ${db.escape(req.dataUser.iduser)},                
    //             ${db.escape(idwarehouse)},                
    //             ${db.escape(idproduct)},                
    //             7,
    //             ${db.escape(invoice)},                
    //             ${db.escape(total_harga)},                
    //             ${db.escape(ongkir)},                
    //             ${db.escape(catatan)},                
    //             ${db.escape(added_date)}.DATE_ADD(now().interval 7 hour),                
    //             ${db.escape(updated_date)}.DATE_ADD(now().interval 7 hour),                
    //         );`

    //         res.status(200).send({
    //             message: 'success transaction',
    //             success: true,
    //             requestStock: requestStock
    //         })
    //     } catch (error) {
    //         console.log(`cek request stock`,requestStock)
    //         res.status(500).send({
    //             success: false,
    //             message: 'failed',
    //             error: error
    //         })
    //     }
    // },
    addCartAdmin: async (req, res) => {
        try {
            let { qty, catatan, idproduct, idstock } = req.body
            console.log(req.body)
            let getData = await dbQuery(`SELECT * FROM carts WHERE iduser=${req.dataUser.iduser} AND idproduct=${idproduct} AND idstock=${idstock} `)
            if (getData.length == 0) {
                await dbQuery(`INSERT INTO carts VALUES (null, ${req.dataUser.iduser}, ${req.body.idproduct}, ${req.body.idstock},  ${db.escape(qty)}, ${db.escape(catatan)})`)
            } else {
                await dbQuery(`UPDATE carts SET qty=${getData[0].qty + qty} WHERE idcart=${getData[0].idcart}`)
            }
            res.status(200).send({
                success: true,
                message: 'add to cart success',
            })
        } catch (error) {
            console.log('error')
            res.status(500).send({
                success: false,
                message: 'failed',
                error: error
            })
        }
    },
    getCartAdmin: async (req, res) => {
        try {
            let resultCart = await dbQuery(`SELECT * FROM carts WHERE iduser=${req.dataUser.iduser}`)
            let resultProducts = await dbQuery(`SELECT idproduct, nama, harga, deskripsi, berat FROM products`)
            let resultImages = await dbQuery(`SELECT * FROM images`)
            let resultStocks = await dbQuery(`SELECT * FROM stocks`)

            resultCart.forEach((item, index) => {
                item.products = []
                item.images = []
                item.stocks = []

                resultProducts.forEach((item2, index) => {
                    if (item.idproduct == item2.idproduct) {
                        item.products.push(item2)
                    }
                })
                resultImages.forEach((item3, index) => {
                    if (item.idproduct == item3.idproduct) {
                        item.images.push(item3)
                    }
                })
                resultStocks.forEach((item4, index) => {
                    if (item.idproduct == item4.idproduct)
                        item.stocks.push(item4)
                })
            })

            res.status(200).send({
                success: true,
                message: 'get data cart success',
                dataCart: resultCart
            })

        } catch (error) {
            console.log('error')
            res.status(500).send({
                success: false,
                message: 'failed',
                error: error
            })
        }
    },
    getRequest: async (req, res) => {
        try {
            filterQuery = []
            let dataRequest
            for (prop in req.query) {
                if (prop == 'fromDate' || prop == 'toDate') {
                    filterQuery.push(`tw.added_date ${prop == 'fromDate' ? '>=' : '<'} ${db.escape(req.query[prop])}`)
                } else {
                    filterQuery.push(`${prop == 'idstatus' ? 'tw.idstatus' : prop == 'idwarehouse' ? 'tw.idwarehouse' : prop}=${db.escape(req.query[prop])}`)
                }
            }
            if (req.dataUser.idrole == 2) {
                dataRequest = await dbQuery(
                    `Select tw.*, w.nama, p.nama as nama_product FROM transaksi_warehouse as tw
                    JOIN warehouse as w ON tw.idkota=w.idkota
                    JOIN products as p ON tw.idproduct=p.idproduct
                    where tw.idwarehouse=${req.dataUser.idwarehouse}
                    ${filterQuery.length > 0 ? `AND ${filterQuery.join(" AND ")}` : ''}
                    ORDER BY tw.idtransaksi_warehouse DESC`)
            }else if ( req.dataUser.idrole == 1){
                dataRequest = await dbQuery(
                    `Select tw.*, w.nama, p.nama as nama_product FROM transaksi_warehouse as tw
                    JOIN warehouse as w ON tw.idkota=w.idkota
                    JOIN products as p ON tw.idproduct=p.idproduct                    
                    ${filterQuery.length > 0 ? `WHERE ${filterQuery.join(" AND ")}` : ''}
                    ORDER BY tw.idtransaksi_warehouse DESC`)
            }
            let resultImages = await dbQuery(`Select * FROM images`)            
            dataRequest.forEach((item, index) => {
                item.images = []

                resultImages.forEach((item2, index) => {
                    if (item.idproduct == item2.idproduct) {
                        item.images.push(item2)
                    }
                })
            })
            res.status(200).send({                
                success: true,
                message: `get data success`,
                dataRequest: dataRequest
            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: 'failed',
                error: error
            })
        }
    },
    outgoingRequest: async (req, res) => {
        try {
            filterQuery = []
            let dataRequest
            for (prop in req.query) {
                if (prop == 'fromDate' || prop == 'toDate') {
                    filterQuery.push(`tw.added_date ${prop == 'fromDate' ? '>=' : '<='} ${db.escape(req.query[prop])}`)
                } else {
                    filterQuery.push(`${prop == 'idstatus' ? 'tw.idstatus' : prop == 'idwarehouse' ? 'tw.idwarehouse' : prop}=${db.escape(req.query[prop])}`)
                }
            }
            if (req.dataUser.idrole == 2) {
                dataRequest = await dbQuery(
                    `Select tw.*, w.nama, p.nama as nama_product, u.username as nama_pengirim FROM transaksi_warehouse as tw
                    JOIN warehouse as w ON tw.idkota=w.idkota
                    JOIN products as p ON tw.idproduct=p.idproduct
                    JOIN users as u ON tw.iduser=u.iduser
                    where tw.iduser=${req.dataUser.iduser}
                    ${filterQuery.length > 0 ? `AND ${filterQuery.join(" AND ")}` : ''}
                    ORDER BY tw.idtransaksi_warehouse DESC`)
            }else if ( req.dataUser.idrole == 1){
                dataRequest = await dbQuery(
                    `Select tw.*, w.nama, p.nama as nama_product FROM transaksi_warehouse as tw
                    JOIN warehouse as w ON tw.idkota=w.idkota
                    JOIN products as p ON tw.idproduct=p.idproduct                    
                    ${filterQuery.length > 0 ? `WHERE ${filterQuery.join(" AND ")}` : ''}
                    ORDER BY tw.idtransaksi_warehouse DESC`)
            }
            let resultImages = await dbQuery(`Select * FROM images`)            
            dataRequest.forEach((item, index) => {
                item.images = []

                resultImages.forEach((item2, index) => {
                    if (item.idproduct == item2.idproduct) {
                        item.images.push(item2)
                    }
                })
            })
            res.status(200).send({
                success: true,
                message: `get data success`,
                dataRequest: dataRequest
            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: 'failed',
                error: error
            })
        }
    },
    checkoutAdmin: async (req, res) => {
        try {
            let { iduser, idwarehouse, idstatus, idproduct, idstock, idprovinsi, idkota, stock, invoice, ongkir, added_date } = req.body
            //insert table transaksi
            let insertTransaction = await dbQuery(`INSERT INTO transaksi_warehouse (iduser, idwarehouse, idstatus, invoice, idproduct, idstock, idprovinsi, idkota, ongkir, added_date, stock)
            VALUES (${db.escape(iduser)}, ${db.escape(idwarehouse)},
             ${db.escape(idstatus)}, ${db.escape(invoice)},             
             ${db.escape(idproduct)}, ${db.escape(idstock)},             
             ${db.escape(idprovinsi)}, ${db.escape(idkota)},             
             ${db.escape(ongkir)}, ${db.escape(added_date)},
             ${db.escape(stock)});`)

            res.status(200).send({
                message: 'success transaction',
                success: true
            })
            // if (insertTransaction.insertId) {
            //     //insert table detail transaksi
            //     await dbQuery(`INSERT INTO detail_transaksi_warehouse (idtransaksi_warehouse, idwarehouse, idproduct, idstock, qty, catatan, sub_total)
            //       VALUES ${req.body.detail.map(item => `(${insertTransaction.insertId},${db.escape(item.idwarehouse)}, ${db.escape(item.idproduct)}, ${db.escape(item.idstock)}, ${db.escape(item.qty)}, ${db.escape(item.catatan)}, ${db.escape(item.products[0].harga * item.qty)})`).toString()}`)
            //     //delete data pada table cart
            //     await dbQuery(`DELETE FROM carts WHERE iduser=${req.dataUser.iduser}`)

            // }
        } catch (error) {
            console.log('error')
            res.status(500).send({
                success: false,
                message: 'failed',
                error: error
            })
        }
    },
    konfirmasiRequest: async (req, res) => {
        try {
            let dataRequest = await dbQuery(`select * FROM transaksi_warehouse
            where idwarehouse=${req.dataUser.idwarehouse};`)
            await dbQuery(`UPDATE transaksi_warehouse set idstatus=${db.escape(req.body.idstatus)}, updated_date=${db.escape(req.body.date)} where idtransaksi_warehouse=${req.params.idtransaksi_warehouse}`)

            dataRequest.forEach(async (item, index) => {
                let getStock = await dbQuery(`SELECT * from stocks where idproduct=${item.idproduct} and idwarehouse=${item.idwarehouse}`)
                let sisaStock = getStock[0].qty - item.stock
                await dbQuery(`UPDATE stocks SET qty=${sisaStock} where idstock=${item.idstock}`)
            })

            res.status(200).send({
                success: true,
                message: `konfirmasi success`
            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: 'failed',
                error: error
            })
        }
    },
    rejectRequest: async (req, res) => {
        try {
            await dbQuery(`UPDATE transaksi_warehouse set idstatus=${db.escape(req.body.idstatus)}, updated_date=${db.escape(req.body.date)} where idtransaksi_warehouse=${req.params.idtransaksi_warehouse}`)

            res.status(200).send({
                success: true,
                message: `reject request success`
            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: 'failed',
                error: error
            })
        }
    },
    getWarehouseAdmin: async (req, res) => {
        try {
            // let getWarehouse = await dbQuery(`SELECT * FROM warehouse;`)
            let getWarehouseAdmin = await dbQuery(`select * from warehouse w join users u on w.idwarehouse = u.idwarehouse where u.iduser = ${req.dataUser.iduser};`)
            res.status(200).send({
                success: true,
                warehouseAdmin: getWarehouseAdmin,
                message: 'Get Warehouse Success'
            });
        } catch (error) {
            console.log('Get Address failed', error)
            res.status(500).send({
                success: false,
                message: 'Get Warehouse error',
                error
            });
        }
    },
    getProductAdmin: async (req, res) => {
        try {
            // let filterQuery = []
            // for (prop in req.query) {
            //     if (req.query[prop]) {
            //         filterQuery.push(` ${prop == 'idwarehouse' ? `s.${prop}` : `${prop} LIKE %${req.query[prop]}%`}`)
            //     }
            // }
            // console.log('isi filter query', filterQuery)            
            let query_get = `SELECT s.*, w.idprovinsi, w.idkota, w.idstatus as status_warehouse, w.nama as nama_warehouse, w.alamat, w.provinsi, w.kota, p.idmaterial, p.idkategori, p.idjenis_product, p.idstatus as status_product, p.nama as nama_product, p.harga, p.deskripsi, p.berat, p.added_date, p.updated_date, k.kategori, j.jenis_product, j.url as url_jenis_product, m.material, m.url as url_material FROM stocks as s
            JOIN warehouse as w ON s.idwarehouse = w.idwarehouse
            JOIN products as p ON s.idproduct = p.idproduct
            JOIN kategori as k ON p.idkategori = k.idkategori
            JOIN jenis_products j ON p.idjenis_product = j.idjenis_product
            JOIN material as m ON p.idmaterial = m.idmaterial            
            WHERE p.idstatus = '1' ${req.query.idwarehouse ? `AND s.idwarehouse = ${req.query.idwarehouse}` : `AND s.idwarehouse = 1`} 
            ${req.query.idproduct ? `AND s.idproduct = ${req.query.idproduct}` : ``};`
            // ${filterQuery.length > 0 ? `AND ${filterQuery.join(" AND ")}` : ''};`
            // console.log('isi query', query_get)
            let resultsProduct = await dbQuery(query_get)
            let resultsImage = await dbQuery(`SELECT * FROM images`)
            // let resultsStock = await dbQuery(`SELECT * FROM stocks`)
            let resultsMaterial = await dbQuery(`SELECT * FROM material`)

            resultsProduct.forEach((item, index) => {
                item.images = [];
                // item.stock = [];
                item.material = [];
                resultsImage.forEach(item2 => {
                    if (item.idproduct == item2.idproduct) {
                        // delete item2.idproduct
                        item.images.push(item2)
                    }
                })
                // resultsStock.forEach(item3 => {
                //     if (item3.idproduct == item.idproduct) {
                //         delete item3.idproduct
                //         item.stock.push(item3)
                //     }
                // })
                resultsMaterial.forEach((item4, index) => {
                    if (item4.idmaterial == item.idmaterial) {
                        item.material.push(item4)
                    }
                })
            })
            res.status(200).send({
                message: 'get data product success',
                success: true,
                dataProduct: resultsProduct
            })
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: 'failed',
                error: error
            })
        }
    }
}